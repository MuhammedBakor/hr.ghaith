package com.ghaith.erp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "finance_requests")
public class FinancialRequest extends BaseEntity {
    private String type;
    private BigDecimal amount;
    private String status; // pending, approved, rejected
    private Long requesterId;
}
