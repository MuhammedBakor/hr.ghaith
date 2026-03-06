package com.ghaith.erp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "fleet_fuel_logs")
public class FuelLog extends BaseEntity {
    private Long vehicleId;
    private Long driverId;
    private String fuelType;
    private Double quantity;
    private BigDecimal cost;
    private LocalDateTime logDate;
    private Double odometer;
    private String station;
}
