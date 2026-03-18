package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "employee_penalties")
public class EmployeePenalty extends BaseEntity {

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "violation_id")
    private Violation violation;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "penalty_type_id")
    private PenaltyType penaltyType;

    @Column(name = "deduction_amount", precision = 15, scale = 2)
    private BigDecimal deductionAmount;

    @Column(name = "deduction_days")
    private Integer deductionDays;

    @Builder.Default
    private String status = "pending"; // pending, approved, executed

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Column(name = "executed_in_payroll_id")
    private Long executedInPayrollId;

    @Column(name = "appeal_deadline")
    private LocalDateTime appealDeadline;

    @Builder.Default
    @Column(name = "appeal_status")
    private String appealStatus = "none"; // none, submitted, accepted, rejected
}
