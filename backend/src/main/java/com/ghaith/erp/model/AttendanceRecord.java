package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "attendance_records")
@EqualsAndHashCode(callSuper = true)
public class AttendanceRecord extends BaseEntity {

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", referencedColumnName = "id", nullable = false)
    private Employee employee;

    // Expose employeeId directly for frontend convenience
    public Long getEmployeeId() {
        return employee != null ? employee.getId() : null;
    }

    @Column(nullable = false)
    private LocalDateTime date;

    private LocalDateTime checkIn;
    private LocalDateTime checkOut;

    private String status; // present, absent, late, early_leave, on_leave, holiday, checked_in,
                           // pending_approval

    private Double workHours;

    private Double checkInLatitude;
    private Double checkInLongitude;
    private Double checkOutLatitude;
    private Double checkOutLongitude;

    private String approvalStatus; // pending, approved, rejected

    private String notes;
}
