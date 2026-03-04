package com.ghaith.erp.service;

import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final HrBranchRepository branchRepository;
    private final InvoiceStatusHistoryRepository historyRepository;
    private final InvoicePaymentRepository paymentRepository;

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

        // Ensure bidirectional link for items
        if (invoice.getItems() != null) {
            invoice.getItems().forEach(item -> item.setInvoice(invoice));
        }

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice updateInvoice(Long id, Invoice invoiceDetails) {
        Invoice invoice = getInvoiceById(id);
        invoice.setClientName(invoiceDetails.getClientName());
        invoice.setAmount(invoiceDetails.getAmount());
        invoice.setIssueDate(invoiceDetails.getIssueDate());
        invoice.setDueDate(invoiceDetails.getDueDate());

        if (!invoice.getStatus().equals(invoiceDetails.getStatus())) {
            updateStatus(id, invoiceDetails.getStatus(), "تحديث يدوي للبيانات");
        }

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice updateStatus(Long id, String newStatus, String reason) {
        Invoice invoice = getInvoiceById(id);

        InvoiceStatusHistory history = InvoiceStatusHistory.builder()
                .invoice(invoice)
                .fromStatus(invoice.getStatus())
                .toStatus(newStatus)
                .reason(reason)
                .build();

        invoice.setStatus(newStatus);
        historyRepository.save(history);
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice recordPayment(Long id, InvoicePayment payment) {
        Invoice invoice = getInvoiceById(id);
        payment.setInvoice(invoice);

        paymentRepository.save(payment);

        // If total payments >= amount, maybe auto-update status to paid?
        // For now, let's just save.

        return invoiceRepository.save(invoice);
    }

    @Transactional
    public void deleteInvoice(Long id) {
        Invoice invoice = getInvoiceById(id);
        invoiceRepository.delete(invoice);
    }
}
