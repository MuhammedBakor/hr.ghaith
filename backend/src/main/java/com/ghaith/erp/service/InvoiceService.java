package com.ghaith.erp.service;

import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final HrBranchRepository branchRepository;
    private final InvoiceStatusHistoryRepository historyRepository;
    private final InvoicePaymentRepository paymentRepository;
    private final InvoiceItemRepository itemRepository;
    private final FinanceJournalService journalService;
    private final NotificationService notificationService;

    public List<Invoice> getAllInvoices(Long branchId) {
        if (branchId != null) {
            return invoiceRepository.findAll().stream()
                    .filter(i -> i.getBranch() != null && i.getBranch().getId().equals(branchId))
                    .toList();
        }
        return invoiceRepository.findAll();
    }

    public Invoice getInvoiceById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));
    }

    @Transactional
    public Invoice createInvoice(Invoice invoice, Long branchId) {
        if (branchId != null) {
            HrBranch branch = branchRepository.findById(branchId)
                    .orElseThrow(() -> new RuntimeException("Branch not found"));
            invoice.setBranch(branch);
        }

        // Calculate VAT (ZATCA 15%)
        calculateVat(invoice);

        // Ensure bidirectional link for items
        if (invoice.getItems() != null) {
            invoice.getItems().forEach(item -> item.setInvoice(invoice));
        }

        if (invoice.getStatus() == null) {
            invoice.setStatus("draft");
        }

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice updateInvoice(Long id, Invoice invoiceDetails) {
        Invoice invoice = getInvoiceById(id);
        invoice.setClientName(invoiceDetails.getClientName());
        invoice.setClientId(invoiceDetails.getClientId());
        invoice.setAmount(invoiceDetails.getAmount());
        invoice.setType(invoiceDetails.getType());
        invoice.setIssueDate(invoiceDetails.getIssueDate());
        invoice.setDueDate(invoiceDetails.getDueDate());
        invoice.setNotes(invoiceDetails.getNotes());

        calculateVat(invoice);

        if (invoiceDetails.getStatus() != null && !invoice.getStatus().equals(invoiceDetails.getStatus())) {
            return updateStatus(id, invoiceDetails.getStatus(), "تحديث يدوي للبيانات");
        }

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice updateStatus(Long id, String newStatus, String reason) {
        Invoice invoice = getInvoiceById(id);
        String oldStatus = invoice.getStatus();

        InvoiceStatusHistory history = InvoiceStatusHistory.builder()
                .invoice(invoice)
                .fromStatus(oldStatus)
                .toStatus(newStatus)
                .reason(reason)
                .build();

        invoice.setStatus(newStatus);
        historyRepository.save(history);

        // Auto journal when status → sent
        if ("sent".equals(newStatus) && !"sent".equals(oldStatus)) {
            try {
                JournalEntry je = journalService.createInvoiceSentJournal(invoice);
                invoice.setJournalEntryId(je.getId());

                // Notify finance team
                notificationService.createNotification(null,
                        "فاتورة مبيعات أُرسلت",
                        "تم إرسال الفاتورة رقم " + invoice.getInvoiceNumber() + " بمبلغ " + invoice.getAmount() + " ر.س",
                        "invoice",
                        invoice.getId(),
                        "Invoice");
            } catch (Exception e) {
                // Log but don't fail the status update
            }
        }

        // Auto journal when paid
        if ("paid".equals(newStatus) && !"paid".equals(oldStatus)) {
            invoice.setOverdueDays(0);
            invoice.setCollectionStage(0);
        }

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice recordPayment(Long id, InvoicePayment payment) {
        Invoice invoice = getInvoiceById(id);
        payment.setInvoice(invoice);
        paymentRepository.save(payment);

        // Calculate total payments made
        double totalPaid = invoice.getPayments().stream()
                .mapToDouble(p -> p.getAmount() != null ? p.getAmount() : 0)
                .sum();
        totalPaid += payment.getAmount() != null ? payment.getAmount() : 0;

        // Auto-update status to paid if fully covered
        if (invoice.getAmount() != null && totalPaid >= invoice.getAmount()) {
            updateStatus(id, "paid", "تم استلام كامل المبلغ");

            // Create payment received journal
            try {
                journalService.createPaymentReceivedJournal(
                        invoice,
                        BigDecimal.valueOf(payment.getAmount()),
                        payment.getPaymentMethod() != null ? payment.getPaymentMethod() : "bank_transfer"
                );
            } catch (Exception e) {
                // Log but don't fail
            }
        }

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public void deleteInvoice(Long id) {
        Invoice invoice = getInvoiceById(id);
        invoiceRepository.delete(invoice);
    }

    @Transactional
    public Invoice addItem(Long invoiceId, InvoiceItem item) {
        Invoice invoice = getInvoiceById(invoiceId);
        item.setInvoice(invoice);
        if (item.getTaxRate() == null) item.setTaxRate(15.0);
        double lineTotal = (item.getQuantity() != null ? item.getQuantity() : 1.0)
                * (item.getUnitPrice() != null ? item.getUnitPrice() : 0.0);
        double tax = lineTotal * (item.getTaxRate() / 100.0);
        item.setTotalAfterTax(lineTotal + tax);
        itemRepository.save(item);
        calculateVat(invoice);
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice deleteItem(Long itemId) {
        InvoiceItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found: " + itemId));
        Invoice invoice = item.getInvoice();
        itemRepository.delete(item);
        calculateVat(invoice);
        return invoiceRepository.save(invoice);
    }

    // ─── VAT calculation ─────────────────────────────────────────────────────
    /**
     * Rules:
     *  - invoice.amount = the pre-tax value entered by the user (unchanged).
     *  - invoice.subtotal = same as amount (or sum of line items if items exist).
     *  - invoice.vatAmount = subtotal * vatRate (15%).
     *  - The grand total is subtotal + vatAmount and is NOT stored back into amount,
     *    so amount always reflects what the user typed.
     */
    private void calculateVat(Invoice invoice) {
        if (invoice.getAmount() == null) return;

        BigDecimal vatRate = invoice.getVatRate() != null
                ? invoice.getVatRate()
                : new BigDecimal("0.15");

        BigDecimal subtotal;

        // If items exist, calculate subtotal from items
        if (invoice.getItems() != null && !invoice.getItems().isEmpty()) {
            subtotal = invoice.getItems().stream()
                    .map(item -> {
                        if (item.getUnitPrice() != null && item.getQuantity() != null) {
                            return BigDecimal.valueOf(item.getUnitPrice())
                                    .multiply(BigDecimal.valueOf(item.getQuantity()));
                        }
                        return BigDecimal.ZERO;
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // When items exist, update the stored amount to match items subtotal
            invoice.setAmount(subtotal.doubleValue());
        } else {
            // No items: use the entered amount as subtotal
            subtotal = BigDecimal.valueOf(invoice.getAmount());
        }

        BigDecimal vatAmount = subtotal.multiply(vatRate).setScale(2, RoundingMode.HALF_UP);

        // Store subtotal and VAT breakdown — amount stays as pre-tax value
        invoice.setSubtotal(subtotal);
        invoice.setVatRate(vatRate);
        invoice.setVatAmount(vatAmount);
        // amount is NOT modified — it equals what the user entered (pre-tax subtotal)
    }
}
