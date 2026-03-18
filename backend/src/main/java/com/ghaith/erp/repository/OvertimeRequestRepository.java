package com.ghaith.erp.repository;

import com.ghaith.erp.model.OvertimeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OvertimeRequestRepository extends JpaRepository<OvertimeRequest, Long> {
    List<OvertimeRequest> findByEmployee_Id(Long employeeId);

    @Query("SELECT SUM(o.hours) FROM OvertimeRequest o WHERE o.employee.id = :employeeId AND o.status = 'approved' AND FUNCTION('MONTH', o.date) = :month AND FUNCTION('YEAR', o.date) = :year")
    Double sumApprovedHoursByEmployeeAndMonth(@Param("employeeId") Long employeeId, @Param("month") int month, @Param("year") int year);
}
