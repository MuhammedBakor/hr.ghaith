package com.ghaith.erp.repository;

import com.ghaith.erp.model.BudgetItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BudgetItemRepository extends JpaRepository<BudgetItem, Long> {
    List<BudgetItem> findByBudgetId(Long budgetId);
    List<BudgetItem> findByBudgetIdAndMonth(Long budgetId, Integer month);
    List<BudgetItem> findByBudgetIdAndCategory(Long budgetId, String category);
}
