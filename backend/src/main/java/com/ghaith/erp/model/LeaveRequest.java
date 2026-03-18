package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "hr_leave_requests")
public class LeaveRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(nullable = false)
    private String leaveType; // e.g., annual, sick, unpaid

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    private LeaveStatus status = LeaveStatus.pending;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String managerRemarks;

    // Approval workflow fields
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_stage")
    private ApprovalStage approvalStage = ApprovalStage.PENDING;

    // Department manager approval
    @Enumerated(EnumType.STRING)
    @Column(name = "dept_manager_decision")
    private ApprovalDecision deptManagerDecision;

    @Column(name = "dept_manager_remarks", columnDefinition = "TEXT")
    private String deptManagerRemarks;

    @Column(name = "dept_manager_decided_at")
    private LocalDateTime deptManagerDecidedAt;

    @Column(name = "dept_manager_id")
    private Long deptManagerId;

    // HR manager approval
    @Enumerated(EnumType.STRING)
    @Column(name = "hr_manager_decision")
    private ApprovalDecision hrManagerDecision;

    @Column(name = "hr_manager_remarks", columnDefinition = "TEXT")
    private String hrManagerRemarks;

    @Column(name = "hr_manager_decided_at")
    private LocalDateTime hrManagerDecidedAt;

    @Column(name = "hr_manager_id")
    private Long hrManagerId;

    // General manager approval
    @Enumerated(EnumType.STRING)
    @Column(name = "gm_decision")
    private ApprovalDecision gmDecision;

    @Column(name = "gm_remarks", columnDefinition = "TEXT")
    private String gmRemarks;

    @Column(name = "gm_decided_at")
    private LocalDateTime gmDecidedAt;

    @Column(name = "gm_id")
    private Long gmId;

    // Number of days requested
    @Column(name = "days_count")
    private Integer daysCount;

    // Document URL (for sick leave, maternity, etc.)
    @Column(name = "document_url")
    private String documentUrl;

    // Auto-generated request number
    @Column(name = "request_number", unique = true)
    private String requestNumber;

    // Escalation deadline for manager approval
    @Column(name = "escalation_deadline")
    private LocalDateTime escalationDeadline;

    public enum LeaveStatus {
        pending, approved, rejected, cancelled
    }

    public enum ApprovalStage {
        PENDING,
        PENDING_DEPT_MANAGER,
        PENDING_HR,
        PENDING_GM,
        APPROVED,
        REJECTED
    }

    public enum ApprovalDecision {
        APPROVED,
        REJECTED
    }
}
