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
@Table(name = "audit_logs")
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog extends BaseEntity {

    private String module;

    @Column(name = "event_type")
    private String eventType;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String severity; // info, warning, error, success

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "workflow_name")
    private String workflowName;

    @Column(name = "step_name")
    private String stepName;

    private String action; // approved, rejected, pending, escalated, returned

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Column(name = "entity_id")
    private Long entityId;
}
