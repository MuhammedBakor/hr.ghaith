package com.ghaith.erp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "legal_cases")
public class LegalCase extends BaseEntity {
    private String caseNumber;
    private String title;
    private String court;
    private String status; // open, won, lost, settled
    private LocalDate nextHearingDate;
    private String lawyer;
    private String description;
}
