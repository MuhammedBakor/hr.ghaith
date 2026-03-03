package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "hr_positions")
public class HrPosition extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 20)
    private String code;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String titleAr;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private HrDepartment department;

    @Builder.Default
    private Integer level = 1;

    @Column(precision = 15, scale = 2)
    private BigDecimal minSalary;

    @Column(precision = 15, scale = 2)
    private BigDecimal maxSalary;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Builder.Default
    private Boolean isActive = true;
}
