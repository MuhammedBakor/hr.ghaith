package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "overtime_requests")
public class OvertimeRequest extends BaseEntity {

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    private LocalDate date;

    @Column(nullable = false)
    private Double hours;

    @Builder.Default
    private String status = "pending"; // pending, approved, rejected

    @Column(name = "approved_by")
    private Long approvedBy;

    @Builder.Default
    private Double multiplier = 1.5;
}
