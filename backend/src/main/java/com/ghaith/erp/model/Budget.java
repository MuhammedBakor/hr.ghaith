package com.ghaith.erp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "finance_budgets")
public class Budget extends BaseEntity {
    private String name;
    private BigDecimal amount;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status; // active, closed, etc.
    private Long branchId;
}
