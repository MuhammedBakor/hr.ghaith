package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Chart of Accounts — one tree per company.
 * Types: asset, liability, equity, revenue, expense
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "finance_accounts")
public class Account extends BaseEntity {

    @Column(nullable = false)
    private String code; // e.g. "1100"

    @Column(nullable = false)
    private String nameAr;

    private String nameEn;

    @Column(nullable = false)
    private String type; // asset, liability, equity, revenue, expense

    private String parentCode; // for tree structure

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "branch_id")
    private Long branchId;

    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;

    /** Running balance (debit-positive for assets/expenses, credit-positive for liabilities/equity/revenue) */
    @Builder.Default
    @Column(precision = 18, scale = 2)
    private java.math.BigDecimal balance = java.math.BigDecimal.ZERO;
}
