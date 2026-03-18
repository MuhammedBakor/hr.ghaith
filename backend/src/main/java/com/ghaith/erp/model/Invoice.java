package com.ghaith.erp.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "invoices")
@EqualsAndHashCode(callSuper = true)
public class Invoice extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String invoiceNumber;

    private String clientName;

    @Column(name = "client_id")
    private Long clientId;

    /** sales, purchase */
    @Builder.Default
    @Column(nullable = false)
    private String type = "sales";

    /** For backward compat — kept as Double */
    @Column(nullable = false)
    private Double amount;

    @Column(precision = 18, scale = 2)
    private BigDecimal subtotal;

    @Builder.Default
    @Column(name = "vat_rate", precision = 5, scale = 2)
    private BigDecimal vatRate = new BigDecimal("0.15"); // 15% ZATCA

    @Builder.Default
    @Column(name = "vat_amount", precision = 18, scale = 2)
    private BigDecimal vatAmount = BigDecimal.ZERO;

    private LocalDateTime issueDate;

    private LocalDateTime dueDate;

    @Column(nullable = false)
    private String status; // draft, sent, paid, overdue, cancelled

    /** Days past due date (updated by cron) */
    @Builder.Default
    @Column(name = "overdue_days")
    private Integer overdueDays = 0;

    /** Late fee accumulated (2% per month after grace period) */
    @Builder.Default
    @Column(name = "late_fee_amount", precision = 18, scale = 2)
    private BigDecimal lateFeeAmount = BigDecimal.ZERO;

    /** Reference to the auto-created journal entry */
    @Column(name = "journal_entry_id")
    private Long journalEntryId;

    @Column(name = "company_id")
    private Long companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private HrBranch branch;

    @Column(columnDefinition = "TEXT")
    private String notes;

    /** Overdue escalation stage: 0=none, 1=day1, 2=day7, 3=day14, 4=day21, 5=day30, 6=day60 */
    @Builder.Default
    @Column(name = "collection_stage")
    private Integer collectionStage = 0;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<InvoicePayment> payments = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<InvoiceStatusHistory> statusHistory = new ArrayList<>();
}
