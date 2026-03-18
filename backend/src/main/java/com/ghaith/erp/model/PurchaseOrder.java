package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * P2P Step 3 — Purchase Order sent to vendor after PR approval.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "finance_purchase_orders")
public class PurchaseOrder extends BaseEntity {

    @Column(name = "order_number", unique = true)
    private String orderNumber; // PO-2026-001

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_request_id")
    private PurchaseRequest purchaseRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id")
    private Vendor vendor;

    @Builder.Default
    private String status = "draft"; // draft, sent, received, partial, cancelled

    @Column(precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "expected_delivery")
    private LocalDateTime expectedDelivery;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    /** Quantity actually received (may differ from ordered) */
    @Column(name = "received_quantity")
    private Integer receivedQuantity;

    @Column(name = "ordered_quantity")
    private Integer orderedQuantity;

    @Column(name = "receipt_notes", columnDefinition = "TEXT")
    private String receiptNotes;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "company_id")
    private Long companyId;

    @Column(name = "branch_id")
    private Long branchId;

    /** Journal entry created when goods are received */
    @Column(name = "goods_receipt_journal_id")
    private Long goodsReceiptJournalId;
}
