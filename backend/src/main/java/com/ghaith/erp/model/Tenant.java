package com.ghaith.erp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "property_tenants")
public class Tenant extends BaseEntity {
    private String name;
    private String contactInfo;
    private String idNumber;
    private String email;
}
