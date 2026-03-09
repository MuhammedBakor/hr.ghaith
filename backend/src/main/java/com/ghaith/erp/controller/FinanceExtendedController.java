package com.ghaith.erp.controller;

import com.ghaith.erp.model.*;
import com.ghaith.erp.service.FinanceExtendedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/v1/finance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FinanceExtendedController {

    private final FinanceExtendedService financeService;

    private static final List<Map<String, Object>> custodies = new CopyOnWriteArrayList<>();
    private static final AtomicLong custodyIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> payments = new CopyOnWriteArrayList<>();
    private static final AtomicLong paymentIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> receivables = new CopyOnWriteArrayList<>();
    private static final AtomicLong receivableIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> fiscalPeriods = new CopyOnWriteArrayList<>();
    private static final AtomicLong fiscalPeriodIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> salaryAdvances = new CopyOnWriteArrayList<>();
    private static final AtomicLong salaryAdvanceIdCounter = new AtomicLong(1);

    @GetMapping("/accounts")
    public ResponseEntity<List<?>> getAccounts() {
        // Still placeholder for specific accounts logic if needed, but returning empty
        // for now
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/budgets")
    public ResponseEntity<List<Budget>> getBudgets() {
        return ResponseEntity.ok(financeService.getAllBudgets());
    }

    @PostMapping("/budgets")
    public ResponseEntity<Budget> createBudget(@RequestBody Budget budget) {
        return ResponseEntity.ok(financeService.createBudget(budget));
    }

    @GetMapping("/vendors")
    public ResponseEntity<List<Vendor>> getVendors() {
        return ResponseEntity.ok(financeService.getAllVendors());
    }

    @PostMapping("/vendors")
    public ResponseEntity<Vendor> createVendor(@RequestBody Vendor vendor) {
        return ResponseEntity.ok(financeService.createVendor(vendor));
    }

    @GetMapping("/warehouses")
    public ResponseEntity<List<Warehouse>> getWarehouses() {
        return ResponseEntity.ok(financeService.getAllWarehouses());
    }

    @PostMapping("/warehouses")
    public ResponseEntity<Warehouse> createWarehouse(@RequestBody Warehouse warehouse) {
        return ResponseEntity.ok(financeService.createWarehouse(warehouse));
    }

    @GetMapping("/vouchers")
    public ResponseEntity<?> getVouchers() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/purchase-orders")
    public ResponseEntity<?> getPurchaseOrders() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/purchase-orders")
    public ResponseEntity<?> createPurchaseOrder(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(body != null ? body : new HashMap<>());
    }

    @GetMapping("/financial-requests")
    public ResponseEntity<List<FinancialRequest>> getFinancialRequests() {
        return ResponseEntity.ok(financeService.getAllFinancialRequests());
    }

    @PostMapping("/financial-requests")
    public ResponseEntity<FinancialRequest> createFinancialRequest(@RequestBody FinancialRequest body) {
        return ResponseEntity.ok(financeService.createFinancialRequest(body));
    }

    @GetMapping("/journal-entries")
    public ResponseEntity<List<JournalEntry>> getJournalEntries() {
        return ResponseEntity.ok(financeService.getAllJournalEntries());
    }

    @PostMapping("/journal-entries")
    public ResponseEntity<JournalEntry> createJournalEntry(@RequestBody JournalEntry body) {
        return ResponseEntity.ok(financeService.createJournalEntry(body));
    }

    @GetMapping("/reports/account-statement")
    public ResponseEntity<?> getAccountStatement() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/reports/general-ledger")
    public ResponseEntity<?> getGeneralLedger() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/reports/trial-balance")
    public ResponseEntity<?> getTrialBalance() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/tax/rates")
    public ResponseEntity<?> getTaxRates() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/tax/calculate")
    public ResponseEntity<?> calculateTax(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("amount", 0);
        response.put("tax", 0);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/tax/calculate-zakat")
    public ResponseEntity<?> calculateZakat(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("amount", 0);
        response.put("zakat", 0);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tax/report")
    public ResponseEntity<?> getTaxReport() {
        return ResponseEntity.ok(new HashMap<>());
    }

    @GetMapping("/p2p")
    public ResponseEntity<?> getP2p() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    // ===== Budgets PUT/DELETE =====

    @PutMapping("/budgets/{id}")
    public ResponseEntity<?> updateBudget(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/budgets/{id}")
    public ResponseEntity<?> deleteBudget(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Custodies =====

    @GetMapping("/custodies")
    public ResponseEntity<?> getCustodies() {
        return ResponseEntity.ok(custodies);
    }

    @PostMapping("/custodies")
    public ResponseEntity<?> createCustody(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", custodyIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        custodies.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/custodies/{id}")
    public ResponseEntity<?> updateCustody(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> item : custodies) {
            if (item.get("id") != null && item.get("id").toString().equals(id.toString())) {
                item.putAll(body);
                item.put("id", id);
                return ResponseEntity.ok(item);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/custodies/{id}")
    public ResponseEntity<?> deleteCustody(@PathVariable Long id) {
        custodies.removeIf(item -> item.get("id") != null && item.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Payments =====

    @GetMapping("/payments")
    public ResponseEntity<?> getPayments() {
        return ResponseEntity.ok(payments);
    }

    @PostMapping("/payments")
    public ResponseEntity<?> createPayment(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", paymentIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        payments.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/payments/{id}")
    public ResponseEntity<?> updatePayment(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> item : payments) {
            if (item.get("id") != null && item.get("id").toString().equals(id.toString())) {
                item.putAll(body);
                item.put("id", id);
                return ResponseEntity.ok(item);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/payments/{id}")
    public ResponseEntity<?> deletePayment(@PathVariable Long id) {
        payments.removeIf(item -> item.get("id") != null && item.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Receivables =====

    @GetMapping("/receivables")
    public ResponseEntity<?> getReceivables() {
        return ResponseEntity.ok(receivables);
    }

    @PostMapping("/receivables")
    public ResponseEntity<?> createReceivable(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", receivableIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        receivables.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/receivables/{id}")
    public ResponseEntity<?> updateReceivable(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> item : receivables) {
            if (item.get("id") != null && item.get("id").toString().equals(id.toString())) {
                item.putAll(body);
                item.put("id", id);
                return ResponseEntity.ok(item);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/receivables/{id}")
    public ResponseEntity<?> deleteReceivable(@PathVariable Long id) {
        receivables.removeIf(item -> item.get("id") != null && item.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Fiscal Periods =====

    @GetMapping("/fiscal-periods")
    public ResponseEntity<?> getFiscalPeriods() {
        return ResponseEntity.ok(fiscalPeriods);
    }

    @PostMapping("/fiscal-periods")
    public ResponseEntity<?> createFiscalPeriod(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", fiscalPeriodIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        fiscalPeriods.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/fiscal-periods/{id}")
    public ResponseEntity<?> updateFiscalPeriod(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> item : fiscalPeriods) {
            if (item.get("id") != null && item.get("id").toString().equals(id.toString())) {
                item.putAll(body);
                item.put("id", id);
                return ResponseEntity.ok(item);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/fiscal-periods/{id}")
    public ResponseEntity<?> deleteFiscalPeriod(@PathVariable Long id) {
        fiscalPeriods.removeIf(item -> item.get("id") != null && item.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Salary Advances =====

    @GetMapping("/salary-advances")
    public ResponseEntity<?> getSalaryAdvances() {
        return ResponseEntity.ok(salaryAdvances);
    }

    @PostMapping("/salary-advances")
    public ResponseEntity<?> createSalaryAdvance(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", salaryAdvanceIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        salaryAdvances.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/salary-advances/{id}")
    public ResponseEntity<?> updateSalaryAdvance(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> item : salaryAdvances) {
            if (item.get("id") != null && item.get("id").toString().equals(id.toString())) {
                item.putAll(body);
                item.put("id", id);
                return ResponseEntity.ok(item);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/salary-advances/{id}")
    public ResponseEntity<?> deleteSalaryAdvance(@PathVariable Long id) {
        salaryAdvances.removeIf(item -> item.get("id") != null && item.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}
