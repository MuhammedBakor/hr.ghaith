package com.ghaith.erp.repository;

import com.ghaith.erp.model.EmployeePenalty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface EmployeePenaltyRepository extends JpaRepository<EmployeePenalty, Long> {
    List<EmployeePenalty> findByEmployee_Id(Long employeeId);

    @Query("SELECT SUM(p.deductionAmount) FROM EmployeePenalty p WHERE p.employee.id = :employeeId AND p.status = 'approved' AND FUNCTION('MONTH', p.effectiveDate) = :month AND FUNCTION('YEAR', p.effectiveDate) = :year")
    java.math.BigDecimal sumApprovedDeductionsByEmployeeAndMonth(@Param("employeeId") Long employeeId, @Param("month") int month, @Param("year") int year);
}
