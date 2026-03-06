package com.ghaith.erp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "property_leases")
public class Lease extends BaseEntity {
    private Long unitId;
    private Long tenantId;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal rentAmount;
    private String status; // active, expired, terminated
}
