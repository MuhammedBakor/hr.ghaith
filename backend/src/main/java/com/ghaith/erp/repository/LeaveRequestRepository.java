package com.ghaith.erp.repository;

import com.ghaith.erp.model.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByEmployeeId(Long employeeId);

    // Find requests by department (for department managers)
    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.department.id = :departmentId")
    List<LeaveRequest> findByEmployeeDepartmentId(@Param("departmentId") Long departmentId);

    // Find requests at a specific approval stage
    List<LeaveRequest> findByApprovalStage(LeaveRequest.ApprovalStage approvalStage);

    // Find requests by department and approval stage
    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.department.id = :departmentId AND lr.approvalStage = :stage")
    List<LeaveRequest> findByEmployeeDepartmentIdAndApprovalStage(
        @Param("departmentId") Long departmentId,
        @Param("stage") LeaveRequest.ApprovalStage stage
    );

    // Count approved leaves for an employee
    @Query("SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.employee.id = :employeeId AND lr.status = 'approved'")
    long countApprovedByEmployeeId(@Param("employeeId") Long employeeId);

    // Count rejected leaves for an employee
    @Query("SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.employee.id = :employeeId AND lr.status = 'rejected'")
    long countRejectedByEmployeeId(@Param("employeeId") Long employeeId);

    // Count leave requests for employees in a specific branch
    @Query("SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.employee.branch.id = :branchId")
    long countByEmployeeBranchId(@Param("branchId") Long branchId);
}
