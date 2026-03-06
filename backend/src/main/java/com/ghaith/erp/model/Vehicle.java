package com.ghaith.erp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "fleet_vehicles")
public class Vehicle extends BaseEntity {
    private String plateNumber;
    private String model;
    private String make;
    private Integer year;
    private String status; // active, maintenance, retired
    private String type; // truck, van, car
}
