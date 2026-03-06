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
