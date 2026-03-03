package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Entity
@Table(name = "hr_attendance_policies")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class AttendancePolicy extends BaseEntity {

    private String code;
    private String name;
    private String description;

    private Integer lateThresholdMinutes;
    private Integer severeLateThresholdMinutes;
    private Integer maxLateMinutesPerMonth;
    private Integer earlyLeaveThresholdMinutes;
    private Integer severeEarlyLeaveMinutes;
    private Integer absenceAfterLateMinutes;
    private Integer consecutiveAbsenceDays;

    private Boolean enableAutoDeduction;
    private BigDecimal lateDeductionPerMinute;
    private BigDecimal lateDeductionFixed;
    private BigDecimal absenceDeductionDays;

    private Boolean enableAutoViolation;
    private Boolean requireCheckInLocation;
    private Integer allowedLocationRadius;

    private Boolean isActive;
    private Boolean isDefault;
}
