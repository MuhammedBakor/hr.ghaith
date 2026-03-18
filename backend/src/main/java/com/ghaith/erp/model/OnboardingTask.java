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
@Table(name = "onboarding_tasks")
public class OnboardingTask extends BaseEntity {

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "task_type", nullable = false)
    private String taskType; // device_handover, contract_sign, team_intro, orientation

    @Column(name = "assigned_to_user_id")
    private Long assignedToUserId;

    @Column(name = "assigned_to_role")
    private String assignedToRole; // IT, HR, MANAGER, TRAINING

    @Builder.Default
    private String status = "pending"; // pending, done

    @Column(name = "due_date")
    private LocalDate dueDate;
}
