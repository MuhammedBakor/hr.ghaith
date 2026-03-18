package com.ghaith.erp.service;

import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.AccountRepository;
import com.ghaith.erp.repository.JournalEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Auto double-entry journal generation.
 *
 * Default accounts (ZATCA-standard codes):
 *  1100 - Accounts Receivable
 *  1200 - Inventory
 *  2100 - Accounts Payable
 *  4100 - Sales Revenue
 *  2300 - VAT Payable
 *  2310 - VAT Receivable
 *  5100 - Expense account
 *  1000 - Cash/Bank
 */
@Service
@RequiredArgsConstructor
public class FinanceJournalService {

    private final JournalEntryRepository journalEntryRepository;
    private final AccountRepository accountRepository;

    // ─── Invoice sent (sales) ────────────────────────────────────────────────
    /**
     * When a sales invoice status changes to "sent":
     *   DR Accounts Receivable  (subtotal + VAT)
     *   CR Sales Revenue        (subtotal)
     *   CR VAT Payable          (vatAmount)
     */
    @Transactional
    public JournalEntry createInvoiceSentJournal(Invoice invoice) {
        BigDecimal subtotal = invoice.getSubtotal() != null
                ? invoice.getSubtotal()
                : BigDecimal.valueOf(invoice.getAmount() != null ? invoice.getAmount() : 0);
        BigDecimal vat = invoice.getVatAmount() != null ? invoice.getVatAmount() : BigDecimal.ZERO;
        BigDecimal total = subtotal.add(vat);

        JournalEntry entry = JournalEntry.builder()
                .entryNumber(generateEntryNumber())
                .entryDate(LocalDate.now())
                .description("فاتورة مبيعات رقم " + invoice.getInvoiceNumber())
                .totalAmount(total)
                .status("posted")
                .sourceType("invoice")
                .sourceId(invoice.getId())
                .companyId(invoice.getCompanyId())
                .postedAt(LocalDateTime.now())
                .build();

        entry.getLines().add(JournalEntryLine.builder()
                .journalEntry(entry)
                .accountCode("1100")
                .accountName("ذمم مدينة")
                .debit(total)
                .credit(BigDecimal.ZERO)
                .description("فاتورة رقم " + invoice.getInvoiceNumber())
                .build());

        entry.getLines().add(JournalEntryLine.builder()
                .journalEntry(entry)
                .accountCode("4100")
                .accountName("إيرادات المبيعات")
                .debit(BigDecimal.ZERO)
                .credit(subtotal)
                .description("إيرادات فاتورة رقم " + invoice.getInvoiceNumber())
                .build());

        if (vat.compareTo(BigDecimal.ZERO) > 0) {
            entry.getLines().add(JournalEntryLine.builder()
                    .journalEntry(entry)
                    .accountCode("2300")
                    .accountName("ضريبة القيمة المضافة مستحقة")
                    .debit(BigDecimal.ZERO)
                    .credit(vat)
                    .description("ضريبة القيمة المضافة 15%")
                    .build());
        }

        return journalEntryRepository.save(entry);
    }

    // ─── Payment received (invoice paid) ────────────────────────────────────
    /**
     * When invoice payment is recorded:
     *   DR Cash/Bank            (amount)
     *   CR Accounts Receivable  (amount)
     */
    @Transactional
    public JournalEntry createPaymentReceivedJournal(Invoice invoice, BigDecimal paymentAmount, String paymentMethod) {
        JournalEntry entry = JournalEntry.builder()
                .entryNumber(generateEntryNumber())
                .entryDate(LocalDate.now())
                .description("استلام دفعة للفاتورة رقم " + invoice.getInvoiceNumber())
                .totalAmount(paymentAmount)
                .status("posted")
                .sourceType("payment")
                .sourceId(invoice.getId())
                .companyId(invoice.getCompanyId())
                .postedAt(LocalDateTime.now())
                .build();

        entry.getLines().add(JournalEntryLine.builder()
                .journalEntry(entry)
                .accountCode("1000")
                .accountName("النقدية / البنك")
                .debit(paymentAmount)
                .credit(BigDecimal.ZERO)
                .description("استلام دفعة - " + paymentMethod)
                .build());

        entry.getLines().add(JournalEntryLine.builder()
                .journalEntry(entry)
                .accountCode("1100")
                .accountName("ذمم مدينة")
                .debit(BigDecimal.ZERO)
                .credit(paymentAmount)
                .description("تسوية فاتورة رقم " + invoice.getInvoiceNumber())
                .build());

        return journalEntryRepository.save(entry);
    }

    // ─── Expense approved ────────────────────────────────────────────────────
    /**
     * When an expense is approved:
     *   DR Expense Account  (amount)
     *   CR Accounts Payable (amount)
     */
    @Transactional
    public JournalEntry createExpenseApprovedJournal(Expense expense) {
        BigDecimal amount = BigDecimal.valueOf(expense.getAmount());

        JournalEntry entry = JournalEntry.builder()
                .entryNumber(generateEntryNumber())
                .entryDate(LocalDate.now())
                .description("اعتماد مصروف: " + expense.getDescription())
                .totalAmount(amount)
                .status("posted")
                .sourceType("expense")
                .sourceId(expense.getId())
                .postedAt(LocalDateTime.now())
                .build();

        entry.getLines().add(JournalEntryLine.builder()
                .journalEntry(entry)
                .accountCode("5100")
                .accountName("المصروفات - " + expense.getCategory())
                .debit(amount)
                .credit(BigDecimal.ZERO)
                .description(expense.getDescription())
                .build());

        entry.getLines().add(JournalEntryLine.builder()
                .journalEntry(entry)
                .accountCode("2100")
                .accountName("ذمم دائنة")
                .debit(BigDecimal.ZERO)
                .credit(amount)
                .description("مصروف معتمد")
                .build());

        return journalEntryRepository.save(entry);
    }

    // ─── Goods receipt (PO received) ─────────────────────────────────────────
    /**
     * When a purchase order is fully received:
     *   DR Inventory        (total amount)
     *   CR Accounts Payable (total amount)
     */
    @Transactional
    public JournalEntry createGoodsReceiptJournal(PurchaseOrder po) {
        BigDecimal amount = po.getTotalAmount() != null ? po.getTotalAmount() : BigDecimal.ZERO;

        JournalEntry entry = JournalEntry.builder()
                .entryNumber(generateEntryNumber())
                .entryDate(LocalDate.now())
                .description("استلام بضاعة - أمر شراء رقم " + po.getOrderNumber())
                .totalAmount(amount)
                .status("posted")
                .sourceType("goods_receipt")
                .sourceId(po.getId())
                .companyId(po.getCompanyId())
                .postedAt(LocalDateTime.now())
                .build();

        entry.getLines().add(JournalEntryLine.builder()
                .journalEntry(entry)
                .accountCode("1200")
                .accountName("المخزون")
                .debit(amount)
                .credit(BigDecimal.ZERO)
                .description("استلام بضاعة - " + po.getOrderNumber())
                .build());

        entry.getLines().add(JournalEntryLine.builder()
                .journalEntry(entry)
                .accountCode("2100")
                .accountName("ذمم دائنة")
                .debit(BigDecimal.ZERO)
                .credit(amount)
                .description("مستحق للمورد - " + (po.getVendor() != null ? po.getVendor().getName() : ""))
                .build());

        return journalEntryRepository.save(entry);
    }

    // ─── Late fee journal ────────────────────────────────────────────────────
    @Transactional
    public JournalEntry createLateFeeJournal(Invoice invoice, BigDecimal feeAmount) {
        JournalEntry entry = JournalEntry.builder()
                .entryNumber(generateEntryNumber())
                .entryDate(LocalDate.now())
                .description("رسوم تأخير - فاتورة رقم " + invoice.getInvoiceNumber())
                .totalAmount(feeAmount)
                .status("posted")
                .sourceType("late_fee")
                .sourceId(invoice.getId())
                .companyId(invoice.getCompanyId())
                .postedAt(LocalDateTime.now())
                .build();

        entry.getLines().add(JournalEntryLine.builder()
                .journalEntry(entry)
                .accountCode("1100")
                .accountName("ذمم مدينة")
                .debit(feeAmount)
                .credit(BigDecimal.ZERO)
                .description("رسوم تأخير 2% شهرياً")
                .build());

        entry.getLines().add(JournalEntryLine.builder()
                .journalEntry(entry)
                .accountCode("4200")
                .accountName("إيرادات رسوم التأخير")
                .debit(BigDecimal.ZERO)
                .credit(feeAmount)
                .description("رسوم تأخير - فاتورة رقم " + invoice.getInvoiceNumber())
                .build());

        return journalEntryRepository.save(entry);
    }

    /**
     * Validate that a journal entry is balanced: SUM(debit) == SUM(credit)
     */
    public boolean isBalanced(List<JournalEntryLine> lines) {
        BigDecimal totalDebit = lines.stream()
                .map(JournalEntryLine::getDebit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = lines.stream()
                .map(JournalEntryLine::getCredit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return totalDebit.compareTo(totalCredit) == 0;
    }

    private String generateEntryNumber() {
        String year = String.valueOf(LocalDate.now().getYear());
        long count = journalEntryRepository.count() + 1;
        return String.format("JE-%s-%04d", year, count);
    }
}
