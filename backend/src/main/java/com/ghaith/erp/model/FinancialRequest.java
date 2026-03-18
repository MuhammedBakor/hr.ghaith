package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "finance_requests")
public class FinancialRequest extends BaseEntity {
    private String type;
    private BigDecimal amount;
    private String status; // pending, approved, rejected
    private Long requesterId;

    @Column(columnDefinition = "TEXT")
    private String description;
}
