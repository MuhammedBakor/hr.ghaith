package com.ghaith.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@Entity
@Table(name = "payroll_records")
@EqualsAndHashCode(callSuper = true)
public class PayrollRecord extends BaseEntity {

    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    private java.math.BigDecimal basicSalary;
    private java.math.BigDecimal housingAllowance;
    private java.math.BigDecimal transportAllowance;
    private java.math.BigDecimal otherAllowances;
    private java.math.BigDecimal deductions;
    private java.math.BigDecimal netSalary;

    private String status; // draft, approved, paid

    private String month;
    private Integer year;

    @JsonManagedReference
    @OneToMany(mappedBy = "payrollRecord", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<PayrollDeduction> deductionDetails;
}
