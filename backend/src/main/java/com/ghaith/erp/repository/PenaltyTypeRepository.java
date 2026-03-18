package com.ghaith.erp.repository;

import com.ghaith.erp.model.PenaltyType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PenaltyTypeRepository extends JpaRepository<PenaltyType, Long> {
    List<PenaltyType> findByIsActiveTrue();
}
