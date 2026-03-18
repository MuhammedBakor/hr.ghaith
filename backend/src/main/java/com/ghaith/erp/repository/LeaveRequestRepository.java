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

    // Find all leave requests for employees in a specific branch
    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.branch.id = :branchId")
    List<LeaveRequest> findByEmployeeBranchId(@Param("branchId") Long branchId);

    // Check if employee is currently on approved leave
    @Query("SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.employee.id = :employeeId AND lr.status = 'approved' AND :today BETWEEN lr.startDate AND lr.endDate")
    long countActiveLeaveForEmployee(@Param("employeeId") Long employeeId, @Param("today") java.time.LocalDate today);

    // Find leave requests by branch and approval stage
    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.branch.id = :branchId AND lr.approvalStage = :stage")
    List<LeaveRequest> findByEmployeeBranchIdAndApprovalStage(
        @Param("branchId") Long branchId,
        @Param("stage") LeaveRequest.ApprovalStage stage
    );

    // Find leave requests by department filtered by branch
    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employee.department.id = :departmentId AND lr.employee.branch.id = :branchId")
    List<LeaveRequest> findByEmployeeDepartmentIdAndBranchId(
        @Param("departmentId") Long departmentId,
        @Param("branchId") Long branchId
    );

    // Check for overlapping leave requests (pending or approved)
    @Query("SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.employee.id = :employeeId AND lr.status IN ('pending', 'approved') AND lr.startDate <= :endDate AND lr.endDate >= :startDate")
    long countOverlappingLeaves(@Param("employeeId") Long employeeId, @Param("startDate") java.time.LocalDate startDate, @Param("endDate") java.time.LocalDate endDate);

    // Count hajj leaves ever taken by employee
    @Query("SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.employee.id = :employeeId AND lr.leaveType = 'hajj' AND lr.status IN ('pending', 'approved')")
    long countHajjLeaves(@Param("employeeId") Long employeeId);

    // Count active (pending/approved) leaves in a department during a date range
    @Query("SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.employee.department.id = :deptId AND lr.status IN ('pending', 'approved') AND lr.startDate <= :endDate AND lr.endDate >= :startDate")
    long countActiveLeavesInDepartment(@Param("deptId") Long deptId, @Param("startDate") java.time.LocalDate startDate, @Param("endDate") java.time.LocalDate endDate);

    // Find pending leaves whose escalation deadline has passed
    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.status = 'pending' AND lr.escalationDeadline IS NOT NULL AND lr.escalationDeadline < :now")
    List<LeaveRequest> findEscalationDue(@Param("now") java.time.LocalDateTime now);
}
