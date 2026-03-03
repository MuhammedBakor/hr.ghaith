package com.ghaith.erp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name = "bi_dashboards")
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BiDashboard extends BaseEntity {

    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String type; // hr, finance, sales, custom

    @Column(columnDefinition = "TEXT")
    private String config; // JSON configuration for charts and layout

    @Column(name = "is_favorite")
    private boolean isFavorite;

    @Column(name = "owner_id")
    private Long ownerId;
}
