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
@Table(name = "operation_limits")
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationLimit extends BaseEntity {

    private String module;
    private String action;

    @Column(name = "max_per_day")
    private Integer maxPerDay;

    @Column(name = "max_per_month")
    private Integer maxPerMonth;

    @Column(name = "max_amount")
    private Double maxAmount;

    @Column(name = "max_daily_amount")
    private Double maxDailyAmount;

    @Column(name = "allowed_from_hour")
    private Integer allowedFromHour;

    @Column(name = "allowed_to_hour")
    private Integer allowedToHour;

    @Column(name = "allowed_days")
    private String allowedDays; // Stored as comma-separated integers

    @Column(name = "is_active")
    private boolean isActive;
}
