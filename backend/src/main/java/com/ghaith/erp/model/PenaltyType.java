package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "penalty_types")
public class PenaltyType extends BaseEntity {

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "name_en")
    private String nameEn;

    private String type; // warning, deduction_days, suspension, termination

    @Column(name = "deduction_days")
    @Builder.Default
    private Integer deductionDays = 0;

    @Builder.Default
    private Boolean isActive = true;
}
