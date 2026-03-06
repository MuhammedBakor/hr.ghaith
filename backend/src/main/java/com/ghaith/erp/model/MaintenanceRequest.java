package com.ghaith.erp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "property_maintenance_requests")
public class MaintenanceRequest extends BaseEntity {
    private Long propertyId;
    private Long unitId;
    private String description;
    private String priority; // low, medium, high, urgent
    private String status; // pending, in_progress, completed, cancelled
}
