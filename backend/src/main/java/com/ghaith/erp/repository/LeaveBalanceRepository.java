package com.ghaith.erp.repository;

import com.ghaith.erp.model.LeaveBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {
    List<LeaveBalance> findByEmployeeId(Long employeeId);
    Optional<LeaveBalance> findByEmployeeIdAndLeaveType(Long employeeId, String leaveType);

    @org.springframework.data.jpa.repository.Query("SELECT lb FROM LeaveBalance lb WHERE lb.employee.branch.id = :branchId")
    List<LeaveBalance> findByEmployeeBranchId(@org.springframework.data.repository.query.Param("branchId") Long branchId);
}
