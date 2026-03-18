package com.ghaith.erp.service;

import com.ghaith.erp.model.Expense;
import com.ghaith.erp.repository.BudgetRepository;
import com.ghaith.erp.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final BudgetRepository budgetRepository;
    private final BudgetService budgetService;
    private final FinanceJournalService journalService;
    private final NotificationService notificationService;

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    public List<Expense> getExpensesByEmployee(Long employeeId) {
        return expenseRepository.findByEmployeeId(employeeId);
    }

    public Expense getExpenseById(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + id));
    }

    @Transactional
    public Expense createExpense(Expense expense) {
        if (expense.getStatus() == null) {
            expense.setStatus("submitted");
        }
        return expenseRepository.save(expense);
    }

    @Transactional
    public Expense updateExpense(Long id, Expense expenseDetails) {
        Expense expense = getExpenseById(id);
        expense.setDescription(expenseDetails.getDescription());
        expense.setCategory(expenseDetails.getCategory());
        expense.setAmount(expenseDetails.getAmount());
        expense.setExpenseDate(expenseDetails.getExpenseDate());
        expense.setEmployeeId(expenseDetails.getEmployeeId());
        expense.setStatus(expenseDetails.getStatus());
        return expenseRepository.save(expense);
    }

    /**
     * Approve expense with 4-level budget check.
     */
    @Transactional
    public Map<String, Object> approveExpense(Long id, Long budgetId, Long approvedByUserId) {
        Expense expense = getExpenseById(id);

        if (!"submitted".equals(expense.getStatus())) {
            throw new RuntimeException("المصروف يجب أن يكون في حالة مقدم");
        }

        BigDecimal amount = BigDecimal.valueOf(expense.getAmount());

        // Budget check before approval
        if (budgetId != null) {
            BudgetService.BudgetCheckResponse budgetCheck = budgetService.checkBudget(budgetId, amount);

            switch (budgetCheck.result) {
                case REJECT -> throw new RuntimeException(
                        "BUDGET_EXCEEDED: " + budgetCheck.message);

                case BLOCK -> {
                    notificationService.createNotification(null,
                            "مصروف يتجاوز الميزانية — يحتاج موافقة المدير العام",
                            expense.getDescription() + " بمبلغ " + expense.getAmount() + " ر.س. " + budgetCheck.message,
                            "expense_budget_block",
                            expense.getId(),
                            "Expense");

                    return Map.of(
                            "status", "pending_gm_approval",
                            "message", budgetCheck.message,
                            "usagePercent", budgetCheck.usagePercent
                    );
                }

                case WARN -> {
                    notificationService.createNotification(null,
                            "تحذير: مصروف يقترب من حد الميزانية",
                            expense.getDescription() + " — " + budgetCheck.message,
                            "expense_budget_warn",
                            expense.getId(),
                            "Expense");
                }

                case NORMAL -> {
                    // Proceed silently
                }
            }

            budgetService.deductFromBudget(budgetId, amount);
        }

        expense.setStatus("approved");
        Expense saved = expenseRepository.save(expense);

        // Auto journal entry
        try {
            journalService.createExpenseApprovedJournal(expense);
        } catch (Exception e) {
            // Log but don't fail approval
        }

        return Map.of(
                "status", "approved",
                "expense", saved,
                "message", "تم اعتماد المصروف بنجاح"
        );
    }

    @Transactional
    public Expense rejectExpense(Long id, String reason) {
        Expense expense = getExpenseById(id);
        expense.setStatus("rejected");
        return expenseRepository.save(expense);
    }

    @Transactional
    public void deleteExpense(Long id) {
        Expense expense = getExpenseById(id);
        expenseRepository.delete(expense);
    }
}
