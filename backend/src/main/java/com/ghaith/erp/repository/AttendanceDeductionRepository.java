package com.ghaith.erp.repository;

import com.ghaith.erp.model.AttendanceDeduction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AttendanceDeductionRepository extends JpaRepository<AttendanceDeduction, Long> {
    List<AttendanceDeduction> findByEmployee_Id(Long employeeId);
    List<AttendanceDeduction> findByEmployee_IdAndMonthAndYear(Long employeeId, String month, Integer year);

    @Query("SELECT SUM(d.amount) FROM AttendanceDeduction d WHERE d.employee.id = :employeeId AND d.month = :month AND d.year = :year AND d.type = :type")
    java.math.BigDecimal sumByEmployeeAndMonthAndType(@Param("employeeId") Long employeeId, @Param("month") String month, @Param("year") Integer year, @Param("type") String type);
}
