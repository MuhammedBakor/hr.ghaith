package com.ghaith.erp.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@Table(name = "payroll_deductions")
public class PayrollDeduction extends BaseEntity {

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_record_id", nullable = false)
    private PayrollRecord payrollRecord;

    @Column(nullable = false)
    private String reason; // e.g. "غياب بدون عذر", "تأخر"

    private String type; // "absence", "late", "other"

    @Column(nullable = false)
    private BigDecimal amount;

    private LocalDate deductionDate;
}
