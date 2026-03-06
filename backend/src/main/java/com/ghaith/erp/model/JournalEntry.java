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
@Table(name = "finance_journal_entries")
public class JournalEntry extends BaseEntity {
    private LocalDate entryDate;
    private String description;
    private BigDecimal totalAmount;
    private String status; // draft, approved, etc.
}
