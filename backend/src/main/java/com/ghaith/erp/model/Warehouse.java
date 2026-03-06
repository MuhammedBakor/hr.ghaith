package com.ghaith.erp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "finance_warehouses")
public class Warehouse extends BaseEntity {
    private String name;
    private String location;
    private Double capacity;
    private Long managerId;
}
