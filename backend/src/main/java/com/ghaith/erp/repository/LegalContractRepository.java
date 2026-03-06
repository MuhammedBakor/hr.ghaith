package com.ghaith.erp.repository;

import com.ghaith.erp.model.LegalContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LegalContractRepository extends JpaRepository<LegalContract, Long> {
}
