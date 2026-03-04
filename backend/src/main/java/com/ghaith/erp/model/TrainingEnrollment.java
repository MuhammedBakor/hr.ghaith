package com.ghaith.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "training_enrollments")
public class TrainingEnrollment extends BaseEntity {

    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_id", nullable = false)
    private TrainingProgram program;

    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", referencedColumnName = "id", nullable = false)
    private Employee employee;

    @Builder.Default
    @Column(nullable = false)
    private java.time.LocalDateTime enrollmentDate = java.time.LocalDateTime.now();

    private LocalDateTime completionDate;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EnrollmentStatus status = EnrollmentStatus.enrolled;

    @Column(precision = 5, scale = 2)
    private BigDecimal score;

    @Column(length = 500)
    private String certificate;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    public enum EnrollmentStatus {
        enrolled, in_progress, completed, withdrawn
    }
}
