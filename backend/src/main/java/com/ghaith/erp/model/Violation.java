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
@Table(name = "violations")
public class Violation extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private String violationType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate violationDate;

    @Builder.Default
    @Column(nullable = false)
    private String status = "sent"; // sent, acknowledged

    @Column(name = "sent_by_user_id")
    private Long sentByUserId;

    @Column(name = "sent_by_name")
    private String sentByName;

    @Column(name = "sent_by_role")
    private String sentByRole;

    /** "auto" = created by the system, "manual" = created by a user */
    @Builder.Default
    @Column(nullable = false)
    private String source = "manual";

    @Column(name = "appeal_reason", columnDefinition = "TEXT")
    private String appealReason;

    @Column(name = "appeal_status")
    private String appealStatus; // pending, accepted, rejected
}
