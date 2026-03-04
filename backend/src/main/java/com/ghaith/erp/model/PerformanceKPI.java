package com.ghaith.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "performance_kpis")
public class PerformanceKPI extends BaseEntity {

    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id")
    private Employee employee;

    @Column(nullable = false)
    private String category; // e.g., "Sales", "Quality", "Compliance"

    @Column(nullable = false)
    private String name;

    private Double targetValue;
    private Double currentValue;
    private String unit; // e.g., "%", "Amount", "Count"

    private Integer weight; // Importance weight
}
