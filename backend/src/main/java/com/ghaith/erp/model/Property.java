package com.ghaith.erp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "properties")
public class Property extends BaseEntity {
    private String name;
    private String address;
    private String type; // residential, commercial, industrial
    private String status; // available, occupied, maintenance
    private String description;
}
