package com.ghaith.erp.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "finance_vendors")
public class Vendor extends BaseEntity {
    private String name;
    private String contactInfo;
    private String taxNumber;
    private String category;

    @Column(name = "total_due")
    private Double totalDue = 0.0;

    @Column(name = "total_paid")
    private Double totalPaid = 0.0;

    @Column
    private Double balance = 0.0;
}
