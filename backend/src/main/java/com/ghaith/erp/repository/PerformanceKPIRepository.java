package com.ghaith.erp.repository;

import com.ghaith.erp.model.PerformanceKPI;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PerformanceKPIRepository extends JpaRepository<PerformanceKPI, Long> {
    List<PerformanceKPI> findByEmployeeId(Long employeeId);
}
