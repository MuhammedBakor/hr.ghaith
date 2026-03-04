package com.ghaith.erp.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "invoice_payments")
public class InvoicePayment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    @JsonBackReference
    private Invoice invoice;

    @Column(unique = true, nullable = false)
    private String paymentNumber;

    @Column(nullable = false)
    private Double amount;

    @Builder.Default
    private LocalDateTime paymentDate = LocalDateTime.now();

    private String paymentMethod; // cash, bank_transfer, check, credit_card, other

    private String referenceNumber;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
