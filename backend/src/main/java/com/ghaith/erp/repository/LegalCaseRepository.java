package com.ghaith.erp.repository;

import com.ghaith.erp.model.LegalCase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LegalCaseRepository extends JpaRepository<LegalCase, Long> {
}
