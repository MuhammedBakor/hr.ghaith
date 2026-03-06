package com.ghaith.erp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "property_units")
public class PropertyUnit extends BaseEntity {
    private String unitNumber;
    private Long propertyId;
    private BigDecimal rentAmount;
    private String status; // vacant, rented, maintenance
    private String type; // studio, 1br, 2br, etc.
}
