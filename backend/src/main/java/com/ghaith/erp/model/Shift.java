package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "hr_shifts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Shift extends BaseEntity {

    private String code;
    private String name;
    private String nameEn;
    private String description;

    @Enumerated(EnumType.STRING)
    private ShiftType shiftType;

    private String startTime;
    private String endTime;

    private String flexibleStartMin;
    private String flexibleStartMax;
    private String flexibleEndMin;
    private String flexibleEndMax;

    private Integer graceMinutesBefore;
    private Integer graceMinutesAfter;
    private Integer earlyLeaveGrace;

    private BigDecimal requiredWorkHours;
    private BigDecimal minWorkHours;

    private Integer breakDurationMinutes;
    private String breakStartTime;
    private String breakEndTime;
    private Boolean isBreakPaid;

    @ElementCollection
    @CollectionTable(name = "hr_shift_work_days", joinColumns = @JoinColumn(name = "shift_id"))
    @Column(name = "work_day")
    private List<String> workDays;

    private Boolean allowOvertime;
    private BigDecimal maxOvertimeHours;
    private BigDecimal overtimeMultiplier;

    private Boolean isActive;
    private Boolean isDefault;

    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "policy_id")
    private AttendancePolicy policy;

    public enum ShiftType {
        regular, flexible, night, split, rotating
    }
}
