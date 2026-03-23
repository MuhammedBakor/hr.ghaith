package com.ghaith.erp.service;

import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FinanceExtendedService {

    private final BudgetRepository budgetRepository;
    private final VendorRepository vendorRepository;
    private final WarehouseRepository warehouseRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final FinancialRequestRepository financialRequestRepository;

    // Budgets
    public List<Budget> getAllBudgets() {
        return budgetRepository.findAll();
    }

    public Budget createBudget(Budget budget) {
        return budgetRepository.save(budget);
    }

    // Vendors
    public List<Vendor> getAllVendors() {
        return vendorRepository.findAll();
    }

    public Vendor createVendor(Vendor vendor) {
        return vendorRepository.save(vendor);
    }

    public Vendor updateVendor(Long id, Vendor details) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vendor not found: " + id));
        if (details.getName() != null) vendor.setName(details.getName());
        if (details.getContactInfo() != null) vendor.setContactInfo(details.getContactInfo());
        if (details.getTaxNumber() != null) vendor.setTaxNumber(details.getTaxNumber());
        if (details.getCategory() != null) vendor.setCategory(details.getCategory());
        if (details.getTotalDue() != null) vendor.setTotalDue(details.getTotalDue());
        if (details.getTotalPaid() != null) vendor.setTotalPaid(details.getTotalPaid());
        if (details.getBalance() != null) vendor.setBalance(details.getBalance());
        return vendorRepository.save(vendor);
    }

    public void deleteVendor(Long id) {
        vendorRepository.deleteById(id);
    }

    // Warehouses
    public List<Warehouse> getAllWarehouses() {
        return warehouseRepository.findAll();
    }

    public Warehouse createWarehouse(Warehouse warehouse) {
        return warehouseRepository.save(warehouse);
    }

    // Journal Entries
    public List<JournalEntry> getAllJournalEntries() {
        return journalEntryRepository.findAll();
    }

    public JournalEntry createJournalEntry(JournalEntry entry) {
        return journalEntryRepository.save(entry);
    }

    // Financial Requests
    public List<FinancialRequest> getAllFinancialRequests() {
        return financialRequestRepository.findAll();
    }

    public FinancialRequest createFinancialRequest(FinancialRequest request) {
        return financialRequestRepository.save(request);
    }
}
