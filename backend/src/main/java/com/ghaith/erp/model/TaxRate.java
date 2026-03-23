package com.ghaith.erp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "finance_tax_rates")
public class TaxRate extends BaseEntity {
    private String name;

    @Column(nullable = false)
    private Double rate;

    private String type; // vat, zakat, custom
}
