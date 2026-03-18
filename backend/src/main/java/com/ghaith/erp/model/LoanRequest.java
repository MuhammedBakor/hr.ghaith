package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "loan_requests")
public class LoanRequest extends BaseEntity {

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Builder.Default
    private String status = "pending"; // pending, approved, rejected

    @Column(name = "monthly_deduction", precision = 15, scale = 2)
    private BigDecimal monthlyDeduction;

    @Column(name = "remaining_balance", precision = 15, scale = 2)
    private BigDecimal remainingBalance;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "installments")
    private Integer installments;
}
