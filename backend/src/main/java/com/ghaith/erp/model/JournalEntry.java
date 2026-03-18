package com.ghaith.erp.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Double-entry journal entry.
 * A valid posted entry must have SUM(debit) = SUM(credit) across all lines.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "finance_journal_entries")
public class JournalEntry extends BaseEntity {

    @Column(name = "entry_number", unique = true)
    private String entryNumber; // JE-2026-001

    private LocalDate entryDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    /** draft, posted, reversed */
    @Builder.Default
    private String status = "draft";

    /** invoice, expense, payment, receipt, manual, goods_receipt */
    @Column(name = "source_type")
    private String sourceType;

    /** ID of the source entity (invoice ID, expense ID, etc.) */
    @Column(name = "source_id")
    private Long sourceId;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "posted_by")
    private Long postedBy;

    @Column(name = "posted_at")
    private LocalDateTime postedAt;

    @OneToMany(mappedBy = "journalEntry", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<JournalEntryLine> lines = new ArrayList<>();
}
