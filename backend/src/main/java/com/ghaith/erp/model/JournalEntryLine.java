package com.ghaith.erp.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "finance_journal_entry_lines")
public class JournalEntryLine extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entry_id", nullable = false)
    @JsonBackReference
    private JournalEntry journalEntry;

    /** Reference to chart-of-accounts account code, e.g. "1100" */
    @Column(name = "account_code", nullable = false)
    private String accountCode;

    @Column(name = "account_name")
    private String accountName;

    @Builder.Default
    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal debit = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal credit = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String description;
}
