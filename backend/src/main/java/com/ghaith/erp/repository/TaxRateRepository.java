package com.ghaith.erp.repository;

import com.ghaith.erp.model.TaxRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaxRateRepository extends JpaRepository<TaxRate, Long> {
}
