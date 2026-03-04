package com.ghaith.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@Entity
@Table(name = "payroll_records")
@EqualsAndHashCode(callSuper = true)
public class PayrollRecord extends BaseEntity {

    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    private Double basicSalary;
    private Double housingAllowance;
    private Double transportAllowance;
    private Double otherAllowances;
    private Double deductions;
    private Double netSalary;

    private String status; // draft, approved, paid

    private String month;
    private Integer year;
}
