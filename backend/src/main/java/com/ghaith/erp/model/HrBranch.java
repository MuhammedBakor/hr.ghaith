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
@Table(name = "hr_branches")
public class HrBranch extends BaseEntity {

    @Column(unique = true, nullable = false, length = 20)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String nameAr;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 20)
    private String phone;

    @Column(length = 320)
    private String email;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    @Builder.Default
    private Integer geoRadius = 100;

    @Builder.Default
    private Boolean geoFenceEnabled = false;

    @Builder.Default
    private Boolean isHeadquarters = false;

    @Builder.Default
    private Boolean isActive = true;
}
