package com.ghaith.erp.service;

import com.ghaith.erp.model.Budget;
import com.ghaith.erp.model.BudgetItem;
import com.ghaith.erp.repository.BudgetItemRepository;
import com.ghaith.erp.repository.BudgetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

/**
 * 4-level budget enforcement:
 *  < 80%  : NORMAL  — approve without notification
 *  80-99% : WARN    — approve + notify finance manager
 *  100-110%: BLOCK  — require GM explicit approval
 *  > 110% : REJECT  — auto-reject, cannot be overridden
 */
@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final BudgetItemRepository budgetItemRepository;

    public enum BudgetCheckResult { NORMAL, WARN, BLOCK, REJECT }

    public static class BudgetCheckResponse {
        public BudgetCheckResult result;
        public double usagePercent;
        public BigDecimal remaining;
        public String message;

        public BudgetCheckResponse(BudgetCheckResult result, double usagePercent, BigDecimal remaining, String message) {
            this.result = result;
            this.usagePercent = usagePercent;
            this.remaining = remaining;
            this.message = message;
        }
    }

    /**
     * Check if adding `amount` to a budget category exceeds thresholds.
     * @param budgetId  the budget to check against
     * @param amount    the new amount being requested
     */
    public BudgetCheckResponse checkBudget(Long budgetId, BigDecimal amount) {
        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new RuntimeException("Budget not found: " + budgetId));

        BigDecimal planned = budget.getAmount();
        if (planned == null || planned.compareTo(BigDecimal.ZERO) == 0) {
            return new BudgetCheckResponse(BudgetCheckResult.NORMAL, 0, BigDecimal.ZERO, "لا يوجد ميزانية محددة");
        }

        BigDecimal currentActual = budget.getActual() != null ? budget.getActual() : BigDecimal.ZERO;
        BigDecimal projected = currentActual.add(amount);
        double usagePercent = projected.divide(planned, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
        BigDecimal remaining = planned.subtract(projected);

        int warnThreshold = budget.getWarnThreshold() != null ? budget.getWarnThreshold() : 80;
        int blockThreshold = budget.getBlockThreshold() != null ? budget.getBlockThreshold() : 100;
        int rejectThreshold = blockThreshold + 10; // 110%

        if (usagePercent > rejectThreshold) {
            return new BudgetCheckResponse(BudgetCheckResult.REJECT, usagePercent, remaining,
                    String.format("تجاوز الميزانية بنسبة %.1f%% — مرفوض تلقائياً", usagePercent - 100));
        } else if (usagePercent >= blockThreshold) {
            return new BudgetCheckResponse(BudgetCheckResult.BLOCK, usagePercent, remaining,
                    String.format("وصلت الميزانية لـ %.1f%% — يتطلب موافقة المدير العام", usagePercent));
        } else if (usagePercent >= warnThreshold) {
            return new BudgetCheckResponse(BudgetCheckResult.WARN, usagePercent, remaining,
                    String.format("تحذير: الميزانية وصلت لـ %.1f%% — يتطلب موافقة مدير المالية", usagePercent));
        }

        return new BudgetCheckResponse(BudgetCheckResult.NORMAL, usagePercent, remaining,
                String.format("ضمن الميزانية (%.1f%%)", usagePercent));
    }

    /**
     * Deduct amount from budget actual (called after expense/invoice approval).
     */
    @Transactional
    public void deductFromBudget(Long budgetId, BigDecimal amount) {
        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new RuntimeException("Budget not found: " + budgetId));
        BigDecimal current = budget.getActual() != null ? budget.getActual() : BigDecimal.ZERO;
        budget.setActual(current.add(amount));
        budgetRepository.save(budget);
    }

    /**
     * Deduct from budget item (monthly breakdown).
     */
    @Transactional
    public void deductFromBudgetItem(Long budgetId, String category, Integer month, BigDecimal amount) {
        List<BudgetItem> items = budgetItemRepository.findByBudgetIdAndCategory(budgetId, category);
        BudgetItem item = items.stream()
                .filter(i -> month == null || month.equals(i.getMonth()))
                .findFirst()
                .orElse(null);

        if (item != null) {
            BigDecimal current = item.getActual() != null ? item.getActual() : BigDecimal.ZERO;
            item.setActual(current.add(amount));
            budgetItemRepository.save(item);
        }
    }

    public List<Budget> getAllBudgets() {
        return budgetRepository.findAll();
    }

    public List<Budget> getBudgetsByCompany(Long companyId) {
        return budgetRepository.findAll().stream()
                .filter(b -> companyId.equals(b.getCompanyId()))
                .toList();
    }

    @Transactional
    public Budget createBudget(Budget budget) {
        if (budget.getItems() != null) {
            budget.getItems().forEach(item -> item.setBudget(budget));
        }
        return budgetRepository.save(budget);
    }

    @Transactional
    public Budget updateBudget(Long id, Budget details) {
        Budget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Budget not found: " + id));
        budget.setName(details.getName());
        budget.setAmount(details.getAmount());
        budget.setActual(details.getActual());
        budget.setStatus(details.getStatus());
        budget.setYear(details.getYear());
        budget.setCategory(details.getCategory());
        budget.setStartDate(details.getStartDate());
        budget.setEndDate(details.getEndDate());
        return budgetRepository.save(budget);
    }

    @Transactional
    public void deleteBudget(Long id) {
        budgetRepository.deleteById(id);
    }

    /**
     * Get budget vs actual summary for reports.
     */
    public Map<String, Object> getBudgetSummary(Long budgetId) {
        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new RuntimeException("Budget not found: " + budgetId));

        BigDecimal planned = budget.getAmount() != null ? budget.getAmount() : BigDecimal.ZERO;
        BigDecimal actual = budget.getActual() != null ? budget.getActual() : BigDecimal.ZERO;
        BigDecimal remaining = planned.subtract(actual);
        double usagePercent = planned.compareTo(BigDecimal.ZERO) > 0
                ? actual.divide(planned, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                : 0;

        return Map.of(
                "budgetId", budgetId,
                "name", budget.getName() != null ? budget.getName() : "",
                "planned", planned,
                "actual", actual,
                "remaining", remaining,
                "usagePercent", usagePercent,
                "status", usagePercent > 110 ? "over_budget" : usagePercent >= 100 ? "at_limit" : usagePercent >= 80 ? "warning" : "normal",
                "items", budgetItemRepository.findByBudgetId(budgetId)
        );
    }
}
