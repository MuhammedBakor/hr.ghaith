package com.ghaith.erp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "legal_tasks")
public class LegalTask extends BaseEntity {
    private String caseId;
    private String playbookCode;
    private String stepCode;
    private String title;
    private String service;
    private String assignedTo;
    private String status; // open, completed, cancelled
}
