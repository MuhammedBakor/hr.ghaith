package com.ghaith.erp.repository;

import com.ghaith.erp.model.FuelLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FuelLogRepository extends JpaRepository<FuelLog, Long> {
}
