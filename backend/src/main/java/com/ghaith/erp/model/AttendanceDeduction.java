package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "attendance_deductions")
public class AttendanceDeduction extends BaseEntity {

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    private LocalDate date;

    private String type; // late_penalty, absence

    @Column(precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(name = "late_minutes")
    private Integer lateMinutes;

    @Builder.Default
    @Column(name = "payroll_status")
    private String payrollStatus = "pending"; // pending, included

    private String month;
    private Integer year;
}
