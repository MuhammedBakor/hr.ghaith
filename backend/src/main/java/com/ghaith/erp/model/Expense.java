package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "expenses")
@EqualsAndHashCode(callSuper = true)
public class Expense extends BaseEntity {

    private String description;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private Double amount;

    private LocalDateTime expenseDate;

    private Long employeeId;

    @Column(nullable = false)
    private String status; // draft, submitted, approved, rejected, paid
}
