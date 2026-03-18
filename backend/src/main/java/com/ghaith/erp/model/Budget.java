package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Annual/monthly budget per company/department.
 * Budget enforcement levels:
 *  < 80%  : normal
 *  80-99% : warn — finance manager approval required
 *  100-110%: block — GM approval required
 *  > 110% : auto-reject
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "finance_budgets")
public class Budget extends BaseEntity {

    private String name;

    /** Total planned amount for this budget */
    @Builder.Default
    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount = BigDecimal.ZERO;

    /** Total actual spent (updated as expenses/invoices are approved) */
    @Builder.Default
    @Column(precision = 18, scale = 2)
    private BigDecimal actual = BigDecimal.ZERO;

    private LocalDate startDate;

    private LocalDate endDate;

    /** active, closed, draft */
    @Builder.Default
    private String status = "active";

    /** Fiscal year, e.g. 2026 */
    private Integer year;

    /** General category: operations, marketing, hr, it, etc. */
    private String category;

    /** Warn threshold percentage (default 80) */
    @Builder.Default
    @Column(name = "warn_threshold")
    private Integer warnThreshold = 80;

    /** Block threshold percentage (default 100) */
    @Builder.Default
    @Column(name = "block_threshold")
    private Integer blockThreshold = 100;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "branch_id")
    private Long branchId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @OneToMany(mappedBy = "budget", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BudgetItem> items = new ArrayList<>();
}
