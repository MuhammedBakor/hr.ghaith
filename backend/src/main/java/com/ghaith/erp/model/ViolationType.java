package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "violation_types")
public class ViolationType extends BaseEntity {

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "name_en")
    private String nameEn;

    private String category; // attendance, conduct, org

    @Builder.Default
    private Boolean isActive = true;
}
