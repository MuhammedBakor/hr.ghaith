package com.ghaith.erp.model;

import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "penalty_escalation_rules")
public class PenaltyEscalationRule extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "violation_type_id", nullable = false)
    private ViolationType violationType;

    @Column(name = "occurrence_number", nullable = false)
    private Integer occurrenceNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "penalty_type_id", nullable = false)
    private PenaltyType penaltyType;

    @Column(name = "period_months", nullable = false)
    @Builder.Default
    private Integer periodMonths = 12;

    @Column(name = "company_id")
    private Long companyId;
}
