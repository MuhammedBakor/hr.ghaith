package com.ghaith.erp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "fleet_drivers")
public class Driver extends BaseEntity {
    private String name;
    private String licenseNumber;
    private String contactInfo;
    private String status; // active, suspended, inactive
}
