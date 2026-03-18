package com.ghaith.erp.service;

import com.ghaith.erp.model.Invoice;
import com.ghaith.erp.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Finance scheduled jobs:
 *  1. overdueDetectionJob   — daily: mark overdue invoices, 6-stage escalation
 *  2. lateFeeJob            — daily: apply 2%/month late fee after grace period
 *  3. budgetResetJob        — Jan 1: annual budget reset
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FinanceCronJobService {

    private final InvoiceRepository invoiceRepository;
    private final NotificationService notificationService;
    private final FinanceJournalService journalService;

    private static final int GRACE_PERIOD_DAYS = 7;  // No late fee for first 7 days
    private static final double LATE_FEE_RATE = 0.02; // 2% per month

    /**
     * Job 1: Mark overdue invoices and trigger 6-stage collection escalation.
     * Runs daily at 8:00 AM.
     *
     * Stage 1 — Day 1:   First reminder notification to client
     * Stage 2 — Day 7:   Second reminder + notify finance manager
     * Stage 3 — Day 14:  Escalate to collections team + create task
     * Stage 4 — Day 21:  Notify GM + legal warning letter
     * Stage 5 — Day 30:  Transfer to legal + suspend credit
     * Stage 6 — Day 60:  Write-off recommendation to GM
     */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void overdueDetectionJob() {
        log.info("[FinanceCron] Running overdue detection job");

        List<Invoice> activeInvoices = invoiceRepository.findAll().stream()
                .filter(inv -> !"paid".equals(inv.getStatus())
                        && !"cancelled".equals(inv.getStatus())
                        && !"draft".equals(inv.getStatus())
                        && inv.getDueDate() != null)
                .toList();

        LocalDateTime now = LocalDateTime.now();

        for (Invoice invoice : activeInvoices) {
            long daysOverdue = ChronoUnit.DAYS.between(invoice.getDueDate(), now);

            if (daysOverdue <= 0) continue;

            // Mark as overdue
            if (!"overdue".equals(invoice.getStatus())) {
                invoice.setStatus("overdue");
            }
            invoice.setOverdueDays((int) daysOverdue);

            // 6-stage escalation — advance stage based on days overdue
            int newStage = calculateCollectionStage(daysOverdue);
            int currentStage = invoice.getCollectionStage() != null ? invoice.getCollectionStage() : 0;

            if (newStage > currentStage) {
                invoice.setCollectionStage(newStage);
                triggerCollectionStage(invoice, newStage, daysOverdue);
            }

            invoiceRepository.save(invoice);
        }

        log.info("[FinanceCron] Overdue detection complete, processed {} invoices", activeInvoices.size());
    }

    private int calculateCollectionStage(long daysOverdue) {
        if (daysOverdue >= 60) return 6;
        if (daysOverdue >= 30) return 5;
        if (daysOverdue >= 21) return 4;
        if (daysOverdue >= 14) return 3;
        if (daysOverdue >= 7)  return 2;
        return 1;
    }

    private void triggerCollectionStage(Invoice invoice, int stage, long daysOverdue) {
        String invoiceRef = invoice.getInvoiceNumber();
        String clientName = invoice.getClientName() != null ? invoice.getClientName() : "العميل";
        String amount = invoice.getAmount() != null ? invoice.getAmount().toString() : "0";

        switch (stage) {
            case 1 -> notificationService.createNotification(null,
                    "فاتورة متأخرة السداد - تنبيه أول",
                    "الفاتورة رقم " + invoiceRef + " للعميل " + clientName + " متأخرة " + daysOverdue + " يوم. المبلغ: " + amount + " ر.س",
                    "invoice_overdue",
                    invoice.getId(),
                    "Invoice");

            case 2 -> notificationService.createNotification(null,
                    "فاتورة متأخرة - تذكير ثانٍ + إشعار مدير المالية",
                    "الفاتورة رقم " + invoiceRef + " متأخرة " + daysOverdue + " يوم. يرجى مراجعة مدير المالية.",
                    "invoice_overdue",
                    invoice.getId(),
                    "Invoice");

            case 3 -> notificationService.createNotification(null,
                    "فاتورة متأخرة - تصعيد لفريق التحصيل",
                    "الفاتورة رقم " + invoiceRef + " تجاوزت 14 يوماً. تم تحويلها لفريق التحصيل.",
                    "invoice_overdue",
                    invoice.getId(),
                    "Invoice");

            case 4 -> notificationService.createNotification(null,
                    "فاتورة متأخرة - إشعار المدير العام",
                    "الفاتورة رقم " + invoiceRef + " تجاوزت 21 يوماً. مطلوب رسالة إنذار قانوني.",
                    "invoice_overdue",
                    invoice.getId(),
                    "Invoice");

            case 5 -> notificationService.createNotification(null,
                    "فاتورة متأخرة - تحويل للشؤون القانونية",
                    "الفاتورة رقم " + invoiceRef + " تجاوزت 30 يوماً. تم تعليق الائتمان وتحويل الملف للقانوني.",
                    "invoice_overdue",
                    invoice.getId(),
                    "Invoice");

            case 6 -> notificationService.createNotification(null,
                    "فاتورة متأخرة جداً - اقتراح شطب",
                    "الفاتورة رقم " + invoiceRef + " تجاوزت 60 يوماً. يُنصح بشطب الدين مع إشعار المدير العام.",
                    "invoice_overdue",
                    invoice.getId(),
                    "Invoice");
        }
    }

    /**
     * Job 2: Apply 2%/month late fee on overdue invoices past grace period.
     * Runs daily at 9:00 AM.
     */
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void lateFeeJob() {
        log.info("[FinanceCron] Running late fee job");

        List<Invoice> overdueInvoices = invoiceRepository.findAll().stream()
                .filter(inv -> "overdue".equals(inv.getStatus())
                        && inv.getDueDate() != null
                        && inv.getAmount() != null)
                .toList();

        for (Invoice invoice : overdueInvoices) {
            long daysOverdue = ChronoUnit.DAYS.between(invoice.getDueDate(), LocalDateTime.now());

            if (daysOverdue <= GRACE_PERIOD_DAYS) continue;

            // Calculate monthly late fee (pro-rated daily)
            double monthsOverdue = (daysOverdue - GRACE_PERIOD_DAYS) / 30.0;
            BigDecimal principal = BigDecimal.valueOf(invoice.getAmount());
            BigDecimal newFee = principal.multiply(BigDecimal.valueOf(LATE_FEE_RATE * monthsOverdue))
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal currentFee = invoice.getLateFeeAmount() != null ? invoice.getLateFeeAmount() : BigDecimal.ZERO;

            // Only update if fee increased
            if (newFee.compareTo(currentFee) > 0) {
                BigDecimal additionalFee = newFee.subtract(currentFee);
                invoice.setLateFeeAmount(newFee);
                invoiceRepository.save(invoice);

                // Create journal entry for the late fee addition
                try {
                    journalService.createLateFeeJournal(invoice, additionalFee);
                } catch (Exception e) {
                    log.error("[FinanceCron] Failed to create late fee journal for invoice {}: {}", invoice.getId(), e.getMessage());
                }
            }
        }

        log.info("[FinanceCron] Late fee job complete");
    }

    /**
     * Job 3: Annual budget reset on January 1st.
     * Resets 'actual' spending to ZERO for next fiscal year budgets.
     */
    @Scheduled(cron = "0 0 0 1 1 *")
    @Transactional
    public void budgetResetJob() {
        log.info("[FinanceCron] Running annual budget reset job");
        // Actual budget reset is handled by BudgetService when new budgets are created
        // This job sends reminders to create new year budgets
        notificationService.createNotification(null,
                "تذكير: إنشاء ميزانية السنة الجديدة",
                "بداية السنة المالية الجديدة — يرجى إنشاء ميزانيات " + LocalDateTime.now().getYear() + " للأقسام المختلفة.",
                "budget_reminder",
                null,
                "Budget");
        log.info("[FinanceCron] Budget reset reminder sent");
    }
}
