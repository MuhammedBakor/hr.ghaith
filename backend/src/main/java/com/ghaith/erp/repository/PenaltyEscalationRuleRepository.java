package com.ghaith.erp.repository;

import com.ghaith.erp.model.PenaltyEscalationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PenaltyEscalationRuleRepository extends JpaRepository<PenaltyEscalationRule, Long> {
    List<PenaltyEscalationRule> findByViolationType_Id(Long violationTypeId);
    Optional<PenaltyEscalationRule> findByViolationType_IdAndOccurrenceNumber(Long violationTypeId, int occurrenceNumber);
}
