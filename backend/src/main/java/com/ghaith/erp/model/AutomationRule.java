package com.ghaith.erp.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

@Data
@Entity
@Table(name = "automation_rules")
@EqualsAndHashCode(callSuper = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AutomationRule extends BaseEntity {

    private String code;
    private String name;
    private String nameAr;
    private String triggerType;
    private String triggerEvent;
    private String actionType;

    @Column(name = "trigger_col")
    private String trigger;

    private String action;
    private String module;

    @Column(columnDefinition = "TEXT")
    private String actionConfig;

    @Column(columnDefinition = "TEXT")
    private String conditions;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    private Boolean isActive = true;
}
