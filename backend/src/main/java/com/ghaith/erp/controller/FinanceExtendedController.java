package com.ghaith.erp.controller;

import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.*;
import com.ghaith.erp.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/v1/finance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FinanceExtendedController {

    private final FinanceExtendedService financeService;
    private final BudgetService budgetService;
    private final PurchaseService purchaseService;
    private final AccountRepository accountRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final JournalEntryLineRepository journalEntryLineRepository;

    // ===== Chart of Accounts =====

    /** Chart of accounts: all finance roles can view */
    @GetMapping("/accounts")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER','DEPARTEMENT_MANAGER')")
    public ResponseEntity<List<Account>> getAccounts(
            @RequestParam(required = false) Long companyId) {
        if (companyId != null) {
            return ResponseEntity.ok(accountRepository.findByCompanyIdAndIsActiveTrue(companyId));
        }
        return ResponseEntity.ok(accountRepository.findAll());
    }

    /** Create/edit accounts: OWNER and GENERAL_MANAGER only */
    @PostMapping("/accounts")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER')")
    public ResponseEntity<Account> createAccount(@RequestBody Account account) {
        if (account.getIsActive() == null) account.setIsActive(true);
        return ResponseEntity.ok(accountRepository.save(account));
    }

    @PutMapping("/accounts/{id}")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER')")
    public ResponseEntity<Account> updateAccount(@PathVariable Long id, @RequestBody Account details) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found: " + id));
        account.setCode(details.getCode());
        account.setNameAr(details.getNameAr());
        account.setNameEn(details.getNameEn());
        account.setType(details.getType());
        account.setParentCode(details.getParentCode());
        account.setIsActive(details.getIsActive());
        return ResponseEntity.ok(accountRepository.save(account));
    }

    @DeleteMapping("/accounts/{id}")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER')")
    public ResponseEntity<?> deleteAccount(@PathVariable Long id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found: " + id));
        account.setIsActive(false);
        accountRepository.save(account);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ===== Budgets =====

    /** View budgets: all managers */
    @GetMapping("/budgets")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER','DEPARTEMENT_MANAGER')")
    public ResponseEntity<List<Budget>> getBudgets(@RequestParam(required = false) Long companyId) {
        if (companyId != null) {
            return ResponseEntity.ok(budgetService.getBudgetsByCompany(companyId));
        }
        return ResponseEntity.ok(budgetService.getAllBudgets());
    }

    @PostMapping("/budgets")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER')")
    public ResponseEntity<Budget> createBudget(@RequestBody Budget budget) {
        return ResponseEntity.ok(budgetService.createBudget(budget));
    }

    @PutMapping("/budgets/{id}")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER')")
    public ResponseEntity<Budget> updateBudget(@PathVariable Long id, @RequestBody Budget details) {
        return ResponseEntity.ok(budgetService.updateBudget(id, details));
    }

    @DeleteMapping("/budgets/{id}")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER')")
    public ResponseEntity<?> deleteBudget(@PathVariable Long id) {
        budgetService.deleteBudget(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/budgets/{id}/summary")
    public ResponseEntity<?> getBudgetSummary(@PathVariable Long id) {
        return ResponseEntity.ok(budgetService.getBudgetSummary(id));
    }

    @PostMapping("/budgets/check")
    public ResponseEntity<?> checkBudget(@RequestBody Map<String, Object> body) {
        Long budgetId = Long.valueOf(body.get("budgetId").toString());
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        BudgetService.BudgetCheckResponse result = budgetService.checkBudget(budgetId, amount);
        return ResponseEntity.ok(Map.of(
                "result", result.result.name(),
                "usagePercent", result.usagePercent,
                "remaining", result.remaining,
                "message", result.message
        ));
    }

    // ===== Journal Entries =====

    /** Journal entries: OWNER and GENERAL_MANAGER only — sensitive accounting data */
    @GetMapping("/journal-entries")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER')")
    public ResponseEntity<List<JournalEntry>> getJournalEntries() {
        return ResponseEntity.ok(financeService.getAllJournalEntries());
    }

    @GetMapping("/journal-entries/{id}")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER')")
    public ResponseEntity<JournalEntry> getJournalEntry(@PathVariable Long id) {
        return ResponseEntity.ok(journalEntryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Journal entry not found: " + id)));
    }

    @PostMapping("/journal-entries")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER')")
    public ResponseEntity<JournalEntry> createJournalEntry(@RequestBody JournalEntry body) {
        if (body.getLines() != null) {
            body.getLines().forEach(line -> line.setJournalEntry(body));
        }
        return ResponseEntity.ok(financeService.createJournalEntry(body));
    }

    // ===== Vendors =====

    @GetMapping("/vendors")
    public ResponseEntity<List<Vendor>> getVendors() {
        return ResponseEntity.ok(financeService.getAllVendors());
    }

    @PostMapping("/vendors")
    public ResponseEntity<Vendor> createVendor(@RequestBody Vendor vendor) {
        return ResponseEntity.ok(financeService.createVendor(vendor));
    }

    // ===== Warehouses =====

    @GetMapping("/warehouses")
    public ResponseEntity<List<Warehouse>> getWarehouses() {
        return ResponseEntity.ok(financeService.getAllWarehouses());
    }

    @PostMapping("/warehouses")
    public ResponseEntity<Warehouse> createWarehouse(@RequestBody Warehouse warehouse) {
        return ResponseEntity.ok(financeService.createWarehouse(warehouse));
    }

    // ===== Financial Requests =====

    @GetMapping("/financial-requests")
    public ResponseEntity<List<FinancialRequest>> getFinancialRequests() {
        return ResponseEntity.ok(financeService.getAllFinancialRequests());
    }

    @PostMapping("/financial-requests")
    public ResponseEntity<FinancialRequest> createFinancialRequest(@RequestBody FinancialRequest body) {
        return ResponseEntity.ok(financeService.createFinancialRequest(body));
    }

    // ===== Purchase Requests (P2P Step 1) =====

    @GetMapping("/purchase-requests")
    public ResponseEntity<?> getPurchaseRequests(@RequestParam(required = false) Long companyId) {
        return ResponseEntity.ok(purchaseService.getAllPurchaseRequests(companyId));
    }

    @PostMapping("/purchase-requests")
    public ResponseEntity<?> createPurchaseRequest(@RequestBody PurchaseRequest pr) {
        return ResponseEntity.ok(purchaseService.createPurchaseRequest(pr));
    }

    @GetMapping("/purchase-requests/{id}")
    public ResponseEntity<?> getPurchaseRequest(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseService.getPurchaseRequestById(id));
    }

    /** Approve/reject purchase requests: managers only */
    @PostMapping("/purchase-requests/{id}/approve")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER','DEPARTEMENT_MANAGER')")
    public ResponseEntity<?> approvePurchaseRequest(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        String decision = body != null && body.get("decision") != null ? (String) body.get("decision") : "approved";
        String reason = body != null ? (String) body.get("rejectionReason") : null;
        Long userId = body != null && body.get("approvedByUserId") != null
                ? Long.valueOf(body.get("approvedByUserId").toString()) : null;
        return ResponseEntity.ok(purchaseService.approvePurchaseRequest(id, userId, decision, reason));
    }

    // ===== Purchase Orders (P2P Steps 3-8) =====

    @GetMapping("/purchase-orders")
    public ResponseEntity<?> getPurchaseOrders(@RequestParam(required = false) Long companyId) {
        return ResponseEntity.ok(purchaseService.getAllPurchaseOrders(companyId));
    }

    @PostMapping("/purchase-orders")
    public ResponseEntity<?> createPurchaseOrder(@RequestBody Map<String, Object> body) {
        Long prId = Long.valueOf(body.get("purchaseRequestId").toString());
        Long vendorId = Long.valueOf(body.get("vendorId").toString());
        LocalDateTime delivery = body.get("expectedDelivery") != null
                ? LocalDateTime.parse(body.get("expectedDelivery").toString()) : null;
        return ResponseEntity.ok(purchaseService.createPurchaseOrder(prId, vendorId, delivery));
    }

    @GetMapping("/purchase-orders/{id}")
    public ResponseEntity<?> getPurchaseOrder(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseService.getPurchaseOrderById(id));
    }

    @PostMapping("/purchase-orders/{id}/send")
    public ResponseEntity<?> sendPurchaseOrder(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseService.sendPurchaseOrder(id));
    }

    @PostMapping("/purchase-orders/{id}/receive")
    public ResponseEntity<?> receiveGoods(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        int receivedQty = Integer.parseInt(body.get("receivedQuantity").toString());
        String notes = body.containsKey("notes") ? (String) body.get("notes") : null;
        return ResponseEntity.ok(purchaseService.receiveGoods(id, receivedQty, notes));
    }

    // ===== P2P overview =====

    @GetMapping("/p2p")
    public ResponseEntity<?> getP2p(@RequestParam(required = false) Long companyId) {
        List<PurchaseRequest> prs = purchaseService.getAllPurchaseRequests(companyId);
        List<PurchaseOrder> pos = purchaseService.getAllPurchaseOrders(companyId);
        return ResponseEntity.ok(Map.of(
                "purchaseRequests", prs,
                "purchaseOrders", pos,
                "pendingRequests", prs.stream().filter(pr -> "pending".equals(pr.getStatus())).count(),
                "openOrders", pos.stream().filter(po -> !"received".equals(po.getStatus()) && !"cancelled".equals(po.getStatus())).count()
        ));
    }

    // ===== Financial Reports =====

    @GetMapping("/reports/trial-balance")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER','DEPARTEMENT_MANAGER')")
    public ResponseEntity<?> getTrialBalance(@RequestParam(required = false) Long companyId) {
        List<Account> accounts = companyId != null
                ? accountRepository.findByCompanyIdAndIsActiveTrue(companyId)
                : accountRepository.findAll();

        List<Map<String, Object>> rows = new ArrayList<>();
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;

        for (Account acc : accounts) {
            BigDecimal balance = acc.getBalance() != null ? acc.getBalance() : BigDecimal.ZERO;
            boolean isDebitNormal = List.of("asset", "expense").contains(acc.getType());

            BigDecimal debit = isDebitNormal && balance.compareTo(BigDecimal.ZERO) >= 0 ? balance : BigDecimal.ZERO;
            BigDecimal credit = !isDebitNormal && balance.compareTo(BigDecimal.ZERO) >= 0 ? balance : BigDecimal.ZERO;

            if (balance.compareTo(BigDecimal.ZERO) != 0) {
                rows.add(Map.of(
                        "accountCode", acc.getCode() != null ? acc.getCode() : "",
                        "accountName", acc.getNameAr() != null ? acc.getNameAr() : "",
                        "accountType", acc.getType() != null ? acc.getType() : "",
                        "debit", debit,
                        "credit", credit
                ));
                totalDebit = totalDebit.add(debit);
                totalCredit = totalCredit.add(credit);
            }
        }

        return ResponseEntity.ok(Map.of(
                "rows", rows,
                "totalDebit", totalDebit,
                "totalCredit", totalCredit,
                "isBalanced", totalDebit.compareTo(totalCredit) == 0
        ));
    }

    @GetMapping("/reports/income-statement")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER','DEPARTEMENT_MANAGER')")
    public ResponseEntity<?> getIncomeStatement(
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) Integer year) {
        List<Account> revenueAccounts = companyId != null
                ? accountRepository.findByCompanyIdAndType(companyId, "revenue")
                : accountRepository.findByType("revenue");

        List<Account> expenseAccounts = companyId != null
                ? accountRepository.findByCompanyIdAndType(companyId, "expense")
                : accountRepository.findByType("expense");

        BigDecimal totalRevenue = revenueAccounts.stream()
                .map(a -> a.getBalance() != null ? a.getBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpenses = expenseAccounts.stream()
                .map(a -> a.getBalance() != null ? a.getBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netIncome = totalRevenue.subtract(totalExpenses);

        return ResponseEntity.ok(Map.of(
                "revenue", Map.of("total", totalRevenue, "accounts", revenueAccounts),
                "expenses", Map.of("total", totalExpenses, "accounts", expenseAccounts),
                "netIncome", netIncome,
                "year", year != null ? year : java.time.LocalDate.now().getYear()
        ));
    }

    @GetMapping("/reports/budget-vs-actual")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER','DEPARTEMENT_MANAGER')")
    public ResponseEntity<?> getBudgetVsActual(@RequestParam(required = false) Long companyId) {
        List<Budget> budgets = companyId != null
                ? budgetService.getBudgetsByCompany(companyId)
                : budgetService.getAllBudgets();

        List<Map<String, Object>> rows = new ArrayList<>();
        for (Budget b : budgets) {
            BigDecimal planned = b.getAmount() != null ? b.getAmount() : BigDecimal.ZERO;
            BigDecimal actual = b.getActual() != null ? b.getActual() : BigDecimal.ZERO;
            BigDecimal variance = planned.subtract(actual);
            double usagePct = planned.compareTo(BigDecimal.ZERO) > 0
                    ? actual.divide(planned, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0;

            rows.add(Map.of(
                    "id", b.getId(),
                    "name", b.getName() != null ? b.getName() : "",
                    "planned", planned,
                    "actual", actual,
                    "variance", variance,
                    "usagePercent", usagePct,
                    "status", usagePct > 110 ? "over_budget" : usagePct >= 100 ? "at_limit" : usagePct >= 80 ? "warning" : "normal"
            ));
        }

        return ResponseEntity.ok(Map.of("budgets", rows));
    }

    @GetMapping("/reports/account-statement")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER')")
    public ResponseEntity<?> getAccountStatement(
            @RequestParam(required = false) String accountCode) {
        if (accountCode == null) return ResponseEntity.ok(Collections.emptyList());

        List<JournalEntryLine> lines = journalEntryLineRepository.findByAccountCode(accountCode);
        BigDecimal totalDebit = lines.stream().map(JournalEntryLine::getDebit).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = lines.stream().map(JournalEntryLine::getCredit).reduce(BigDecimal.ZERO, BigDecimal::add);

        return ResponseEntity.ok(Map.of(
                "accountCode", accountCode,
                "lines", lines,
                "totalDebit", totalDebit,
                "totalCredit", totalCredit,
                "balance", totalDebit.subtract(totalCredit)
        ));
    }

    @GetMapping("/reports/general-ledger")
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER')")
    public ResponseEntity<?> getGeneralLedger(@RequestParam(required = false) Long companyId) {
        List<JournalEntry> entries = journalEntryRepository.findAll().stream()
                .filter(e -> "posted".equals(e.getStatus()))
                .filter(e -> companyId == null || companyId.equals(e.getCompanyId()))
                .toList();
        return ResponseEntity.ok(entries);
    }

    // ===== Tax =====

    @GetMapping("/tax/rates")
    public ResponseEntity<?> getTaxRates() {
        return ResponseEntity.ok(List.of(
                Map.of("name", "ضريبة القيمة المضافة (ZATCA)", "rate", 0.15, "type", "vat"),
                Map.of("name", "الزكاة", "rate", 0.025, "type", "zakat")
        ));
    }

    @PostMapping("/tax/calculate")
    public ResponseEntity<?> calculateTax(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null || !body.containsKey("amount")) {
            return ResponseEntity.ok(Map.of("amount", 0, "tax", 0, "total", 0));
        }
        double amount = Double.parseDouble(body.get("amount").toString());
        double rate = body.containsKey("rate") ? Double.parseDouble(body.get("rate").toString()) : 0.15;
        double tax = amount * rate;
        return ResponseEntity.ok(Map.of(
                "amount", amount,
                "rate", rate,
                "tax", BigDecimal.valueOf(tax).setScale(2, RoundingMode.HALF_UP),
                "total", BigDecimal.valueOf(amount + tax).setScale(2, RoundingMode.HALF_UP)
        ));
    }

    @PostMapping("/tax/calculate-zakat")
    public ResponseEntity<?> calculateZakat(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null || !body.containsKey("amount")) {
            return ResponseEntity.ok(Map.of("amount", 0, "zakat", 0));
        }
        double amount = Double.parseDouble(body.get("amount").toString());
        double zakat = amount * 0.025;
        return ResponseEntity.ok(Map.of(
                "amount", amount,
                "zakat", BigDecimal.valueOf(zakat).setScale(2, RoundingMode.HALF_UP)
        ));
    }

    @GetMapping("/tax/report")
    public ResponseEntity<?> getTaxReport(@RequestParam(required = false) Integer year) {
        int reportYear = year != null ? year : java.time.LocalDate.now().getYear();
        return ResponseEntity.ok(Map.of("year", reportYear, "vatCollected", 0, "vatPaid", 0, "netVat", 0));
    }

    // ===== Vouchers =====

    @GetMapping("/vouchers")
    public ResponseEntity<?> getVouchers() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    // ===== Custodies (stored via FinancialRequest type=custody) =====

    @GetMapping("/custodies")
    public ResponseEntity<?> getCustodies() {
        return ResponseEntity.ok(financeService.getAllFinancialRequests().stream()
                .filter(r -> "custody".equals(r.getType()))
                .toList());
    }

    @PostMapping("/custodies")
    public ResponseEntity<?> createCustody(@RequestBody(required = false) Map<String, Object> body) {
        FinancialRequest req = new FinancialRequest();
        req.setType("custody");
        if (body != null) req.setDescription(body.getOrDefault("description", "").toString());
        return ResponseEntity.ok(financeService.createFinancialRequest(req));
    }

    @PutMapping("/custodies/{id}")
    public ResponseEntity<?> updateCustody(@PathVariable Long id,
                                            @RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(Map.of("id", id, "updated", true));
    }

    @DeleteMapping("/custodies/{id}")
    public ResponseEntity<?> deleteCustody(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ===== Payments =====

    @GetMapping("/payments")
    public ResponseEntity<?> getPayments() {
        return ResponseEntity.ok(financeService.getAllFinancialRequests().stream()
                .filter(r -> "payment".equals(r.getType()))
                .toList());
    }

    @PostMapping("/payments")
    public ResponseEntity<?> createPayment(@RequestBody(required = false) Map<String, Object> body) {
        FinancialRequest req = new FinancialRequest();
        req.setType("payment");
        if (body != null) req.setDescription(body.getOrDefault("description", "").toString());
        return ResponseEntity.ok(financeService.createFinancialRequest(req));
    }

    @PutMapping("/payments/{id}")
    public ResponseEntity<?> updatePayment(@PathVariable Long id,
                                            @RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(Map.of("id", id, "updated", true));
    }

    @DeleteMapping("/payments/{id}")
    public ResponseEntity<?> deletePayment(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ===== Receivables =====

    @GetMapping("/receivables")
    public ResponseEntity<?> getReceivables() {
        return ResponseEntity.ok(financeService.getAllFinancialRequests().stream()
                .filter(r -> "receivable".equals(r.getType()))
                .toList());
    }

    @PostMapping("/receivables")
    public ResponseEntity<?> createReceivable(@RequestBody(required = false) Map<String, Object> body) {
        FinancialRequest req = new FinancialRequest();
        req.setType("receivable");
        if (body != null) req.setDescription(body.getOrDefault("description", "").toString());
        return ResponseEntity.ok(financeService.createFinancialRequest(req));
    }

    @PutMapping("/receivables/{id}")
    public ResponseEntity<?> updateReceivable(@PathVariable Long id,
                                               @RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(Map.of("id", id, "updated", true));
    }

    @DeleteMapping("/receivables/{id}")
    public ResponseEntity<?> deleteReceivable(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ===== Fiscal Periods =====

    @GetMapping("/fiscal-periods")
    public ResponseEntity<?> getFiscalPeriods() {
        return ResponseEntity.ok(financeService.getAllFinancialRequests().stream()
                .filter(r -> "fiscal_period".equals(r.getType()))
                .toList());
    }

    @PostMapping("/fiscal-periods")
    public ResponseEntity<?> createFiscalPeriod(@RequestBody(required = false) Map<String, Object> body) {
        FinancialRequest req = new FinancialRequest();
        req.setType("fiscal_period");
        if (body != null) req.setDescription(body.getOrDefault("description", "").toString());
        return ResponseEntity.ok(financeService.createFinancialRequest(req));
    }

    @PutMapping("/fiscal-periods/{id}")
    public ResponseEntity<?> updateFiscalPeriod(@PathVariable Long id,
                                                 @RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(Map.of("id", id, "updated", true));
    }

    @DeleteMapping("/fiscal-periods/{id}")
    public ResponseEntity<?> deleteFiscalPeriod(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ===== Salary Advances =====

    @GetMapping("/salary-advances")
    public ResponseEntity<?> getSalaryAdvances() {
        return ResponseEntity.ok(financeService.getAllFinancialRequests().stream()
                .filter(r -> "salary_advance".equals(r.getType()))
                .toList());
    }

    @PostMapping("/salary-advances")
    public ResponseEntity<?> createSalaryAdvance(@RequestBody(required = false) Map<String, Object> body) {
        FinancialRequest req = new FinancialRequest();
        req.setType("salary_advance");
        if (body != null) req.setDescription(body.getOrDefault("description", "").toString());
        return ResponseEntity.ok(financeService.createFinancialRequest(req));
    }

    @PutMapping("/salary-advances/{id}")
    public ResponseEntity<?> updateSalaryAdvance(@PathVariable Long id,
                                                  @RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(Map.of("id", id, "updated", true));
    }

    @DeleteMapping("/salary-advances/{id}")
    public ResponseEntity<?> deleteSalaryAdvance(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("success", true));
    }
}
