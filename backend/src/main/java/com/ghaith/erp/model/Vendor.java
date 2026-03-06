package com.ghaith.erp.model;

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
}
