package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

/**
 * Monthly breakdown of a budget — one row per category per month.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "finance_budget_items")
public class BudgetItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "budget_id", nullable = false)
    private Budget budget;

    @Column(nullable = false)
    private String category; // e.g. "revenue", "salaries", "maintenance"

    private Integer month; // 1-12

    private Integer year;

    @Builder.Default
    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal planned = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal actual = BigDecimal.ZERO;
}
