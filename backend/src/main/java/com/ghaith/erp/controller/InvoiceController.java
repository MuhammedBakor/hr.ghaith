package com.ghaith.erp.controller;

import com.ghaith.erp.model.*;
import com.ghaith.erp.service.InvoiceService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/finance/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    /** View invoices: owners, managers, supervisors, agents */
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER','DEPARTEMENT_MANAGER','SUPERVISOR','AGENT')")
    public ResponseEntity<List<Invoice>> getAllInvoices(@RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(invoiceService.getAllInvoices(branchId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER','DEPARTEMENT_MANAGER','SUPERVISOR','AGENT')")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id));
    }

    /** Create invoice: owners, managers, agents */
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER','DEPARTEMENT_MANAGER','AGENT')")
    public ResponseEntity<Invoice> createInvoice(@RequestBody Invoice invoice,
            @RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(invoiceService.createInvoice(invoice, branchId));
    }

    /** Update invoice: owners and managers only */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER','DEPARTEMENT_MANAGER')")
    public ResponseEntity<Invoice> updateInvoice(@PathVariable Long id, @RequestBody Invoice invoice) {
        return ResponseEntity.ok(invoiceService.updateInvoice(id, invoice));
    }

    /** Change invoice status: owners and managers (approve, send, cancel) */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER','DEPARTEMENT_MANAGER')")
    public ResponseEntity<Invoice> updateStatus(@PathVariable Long id, @RequestBody StatusRequest request) {
        return ResponseEntity.ok(invoiceService.updateStatus(id, request.getStatus(), request.getReason()));
    }

    /** Record payment: owners and managers */
    @PostMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER','DEPARTEMENT_MANAGER')")
    public ResponseEntity<Invoice> recordPayment(@PathVariable Long id,
            @RequestBody com.ghaith.erp.model.InvoicePayment payment) {
        return ResponseEntity.ok(invoiceService.recordPayment(id, payment));
    }

    /** Delete invoice: owners and general managers only */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER')")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        invoiceService.deleteInvoice(id);
        return ResponseEntity.noContent().build();
    }

    /** Add line item to invoice */
    @PostMapping("/{id}/items")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER','DEPARTEMENT_MANAGER','AGENT')")
    public ResponseEntity<Invoice> addItem(@PathVariable Long id, @RequestBody InvoiceItem item) {
        return ResponseEntity.ok(invoiceService.addItem(id, item));
    }

    /** Delete a line item */
    @DeleteMapping("/items/{itemId}")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER','DEPARTEMENT_MANAGER')")
    public ResponseEntity<Invoice> deleteItem(@PathVariable Long itemId) {
        return ResponseEntity.ok(invoiceService.deleteItem(itemId));
    }

    @Data
    public static class StatusRequest {
        private String status;
        private String reason;
    }
}
