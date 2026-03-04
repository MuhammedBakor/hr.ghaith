package com.ghaith.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "performance_goals")
public class PerformanceGoal extends BaseEntity {

    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    private LocalDate deadline;

    @Builder.Default
    private Integer progress = 0; // 0-100

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private GoalStatus status = GoalStatus.in_progress;

    public enum GoalStatus {
        in_progress, completed, cancelled, overdue
    }
}
