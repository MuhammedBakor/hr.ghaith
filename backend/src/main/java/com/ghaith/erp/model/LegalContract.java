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
@Table(name = "legal_contracts")
public class LegalContract extends BaseEntity {
    private String contractNumber;
    private String title;
    private String partyName;
    private String partyA;
    private String partyB;
    private String contractType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status; // draft, active, expired, terminated
    private BigDecimal amount;
    private BigDecimal value;
    private String category; // employment, vendor, property, etc.
    private String description;
}
