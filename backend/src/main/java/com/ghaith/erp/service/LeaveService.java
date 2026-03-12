package com.ghaith.erp.service;

import com.ghaith.erp.model.LeaveRequest;
import com.ghaith.erp.model.Employee;
import com.ghaith.erp.repository.LeaveRequestRepository;
import com.ghaith.erp.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRequestRepository leaveRepository;
    private final EmployeeRepository employeeRepository;
    private final LeaveBalanceService leaveBalanceService;

    public List<LeaveRequest> getAllLeaveRequests(Long branchId) {
        if (branchId != null) {
            return leaveRepository.findByEmployeeBranchId(branchId);
        }
        return leaveRepository.findAll();
    }

    public List<LeaveRequest> getLeaveRequestsByEmployee(Long employeeId) {
        return leaveRepository.findByEmployeeId(employeeId);
    }

    public Optional<LeaveRequest> getLeaveRequestById(Long id) {
        return leaveRepository.findById(id);
    }

    public List<LeaveRequest> getLeaveRequestsByDepartment(Long departmentId, Long branchId) {
        if (branchId != null) {
            return leaveRepository.findByEmployeeDepartmentIdAndBranchId(departmentId, branchId);
        }
        return leaveRepository.findByEmployeeDepartmentId(departmentId);
    }

    public List<LeaveRequest> getLeaveRequestsByApprovalStage(LeaveRequest.ApprovalStage stage, Long branchId) {
        if (branchId != null) {
            return leaveRepository.findByEmployeeBranchIdAndApprovalStage(branchId, stage);
        }
        return leaveRepository.findByApprovalStage(stage);
    }

    public List<LeaveRequest> getLeaveRequestsByDepartmentAndStage(Long departmentId, LeaveRequest.ApprovalStage stage, Long branchId) {
        if (branchId != null) {
            // Filter by department + stage + branch
            return leaveRepository.findByEmployeeDepartmentIdAndApprovalStage(departmentId, stage)
                .stream()
                .filter(lr -> lr.getEmployee() != null
                    && lr.getEmployee().getBranch() != null
                    && branchId.equals(lr.getEmployee().getBranch().getId()))
                .collect(java.util.stream.Collectors.toList());
        }
        return leaveRepository.findByEmployeeDepartmentIdAndApprovalStage(departmentId, stage);
    }

    public Map<String, Object> getEmployeeLeaveStats(Long employeeId) {
        Map<String, Object> stats = new HashMap<>();
        stats.put("approved", leaveRepository.countApprovedByEmployeeId(employeeId));
        stats.put("rejected", leaveRepository.countRejectedByEmployeeId(employeeId));
        stats.put("balances", leaveBalanceService.getBalancesByEmployee(employeeId));
        return stats;
    }

    @Transactional
    public LeaveRequest createLeaveRequest(java.util.Map<String, Object> payload) {
        Number empIdNum = (Number) payload.get("employeeId");
        if (empIdNum == null) {
            throw new RuntimeException("employeeId is required");
        }

        Long employeeId = empIdNum.longValue();
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found"));

        String leaveType = (String) payload.get("leaveType");
        LocalDate startDate = LocalDate.parse((String) payload.get("startDate"));
        LocalDate endDate = LocalDate.parse((String) payload.get("endDate"));
        int daysCount = (int) (ChronoUnit.DAYS.between(startDate, endDate) + 1);

        // Check leave balance (skip for unpaid leaves)
        if (!"unpaid".equals(leaveType)) {
            if (!leaveBalanceService.hasEnoughBalance(employeeId, leaveType, daysCount)) {
                throw new RuntimeException("INSUFFICIENT_BALANCE:لا يوجد رصيد كافي من الإجازات. الرجاء مراجعة رصيد إجازاتك.");
            }
        }

        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setEmployee(employee);
        leaveRequest.setLeaveType(leaveType);
        leaveRequest.setStartDate(startDate);
        leaveRequest.setEndDate(endDate);
        leaveRequest.setReason((String) payload.get("reason"));
        leaveRequest.setStatus(LeaveRequest.LeaveStatus.pending);
        leaveRequest.setApprovalStage(LeaveRequest.ApprovalStage.PENDING);
        leaveRequest.setDaysCount(daysCount);

        return leaveRepository.save(leaveRequest);
    }

    public LeaveRequest updateLeaveRequest(Long id, LeaveRequest leaveDetails) {
        return leaveRepository.findById(id)
                .map(leave -> {
                    if (leaveDetails.getLeaveType() != null) leave.setLeaveType(leaveDetails.getLeaveType());
                    if (leaveDetails.getStartDate() != null) leave.setStartDate(leaveDetails.getStartDate());
                    if (leaveDetails.getEndDate() != null) leave.setEndDate(leaveDetails.getEndDate());
                    if (leaveDetails.getReason() != null) leave.setReason(leaveDetails.getReason());
                    if (leaveDetails.getStatus() != null) leave.setStatus(leaveDetails.getStatus());
                    if (leaveDetails.getManagerRemarks() != null) leave.setManagerRemarks(leaveDetails.getManagerRemarks());
                    return leaveRepository.save(leave);
                }).orElseThrow(() -> new RuntimeException("Leave request not found with id " + id));
    }

    private void validatePendingStage(LeaveRequest leave) {
        if (leave.getApprovalStage() != LeaveRequest.ApprovalStage.PENDING) {
            throw new RuntimeException("طلب الإجازة ليس في انتظار الموافقة");
        }
    }

    private void finalApprove(LeaveRequest leave) {
        leave.setApprovalStage(LeaveRequest.ApprovalStage.APPROVED);
        leave.setStatus(LeaveRequest.LeaveStatus.approved);

        // Deduct balance on approval (skip for unpaid)
        if (!"unpaid".equals(leave.getLeaveType())) {
            try {
                leaveBalanceService.deductBalance(
                    leave.getEmployee().getId(),
                    leave.getLeaveType(),
                    leave.getDaysCount()
                );
            } catch (RuntimeException e) {
                leave.setManagerRemarks((leave.getManagerRemarks() != null ? leave.getManagerRemarks() + " | " : "") +
                    "تنبيه: لم يتم خصم الرصيد - " + e.getMessage());
            }
        }
    }

    private void finalReject(LeaveRequest leave, String remarks) {
        leave.setApprovalStage(LeaveRequest.ApprovalStage.REJECTED);
        leave.setStatus(LeaveRequest.LeaveStatus.rejected);
        leave.setManagerRemarks(remarks);
    }

    @Transactional
    public LeaveRequest approveByDeptManager(Long leaveId, Long managerId, String remarks) {
        LeaveRequest leave = leaveRepository.findById(leaveId)
            .orElseThrow(() -> new RuntimeException("Leave request not found"));
        validatePendingStage(leave);

        leave.setDeptManagerDecision(LeaveRequest.ApprovalDecision.APPROVED);
        leave.setDeptManagerRemarks(remarks);
        leave.setDeptManagerDecidedAt(LocalDateTime.now());
        leave.setDeptManagerId(managerId);
        finalApprove(leave);

        return leaveRepository.save(leave);
    }

    @Transactional
    public LeaveRequest rejectByDeptManager(Long leaveId, Long managerId, String remarks) {
        LeaveRequest leave = leaveRepository.findById(leaveId)
            .orElseThrow(() -> new RuntimeException("Leave request not found"));
        validatePendingStage(leave);

        leave.setDeptManagerDecision(LeaveRequest.ApprovalDecision.REJECTED);
        leave.setDeptManagerRemarks(remarks);
        leave.setDeptManagerDecidedAt(LocalDateTime.now());
        leave.setDeptManagerId(managerId);
        finalReject(leave, remarks);

        return leaveRepository.save(leave);
    }

    @Transactional
    public LeaveRequest approveByHrManager(Long leaveId, Long hrManagerId, String remarks) {
        LeaveRequest leave = leaveRepository.findById(leaveId)
            .orElseThrow(() -> new RuntimeException("Leave request not found"));
        validatePendingStage(leave);

        leave.setHrManagerDecision(LeaveRequest.ApprovalDecision.APPROVED);
        leave.setHrManagerRemarks(remarks);
        leave.setHrManagerDecidedAt(LocalDateTime.now());
        leave.setHrManagerId(hrManagerId);
        finalApprove(leave);

        return leaveRepository.save(leave);
    }

    @Transactional
    public LeaveRequest rejectByHrManager(Long leaveId, Long hrManagerId, String remarks) {
        LeaveRequest leave = leaveRepository.findById(leaveId)
            .orElseThrow(() -> new RuntimeException("Leave request not found"));
        validatePendingStage(leave);

        leave.setHrManagerDecision(LeaveRequest.ApprovalDecision.REJECTED);
        leave.setHrManagerRemarks(remarks);
        leave.setHrManagerDecidedAt(LocalDateTime.now());
        leave.setHrManagerId(hrManagerId);
        finalReject(leave, remarks);

        return leaveRepository.save(leave);
    }

    @Transactional
    public LeaveRequest approveByGM(Long leaveId, Long gmId, String remarks) {
        LeaveRequest leave = leaveRepository.findById(leaveId)
            .orElseThrow(() -> new RuntimeException("Leave request not found"));
        validatePendingStage(leave);

        leave.setGmDecision(LeaveRequest.ApprovalDecision.APPROVED);
        leave.setGmRemarks(remarks);
        leave.setGmDecidedAt(LocalDateTime.now());
        leave.setGmId(gmId);
        finalApprove(leave);

        return leaveRepository.save(leave);
    }

    @Transactional
    public LeaveRequest rejectByGM(Long leaveId, Long gmId, String remarks) {
        LeaveRequest leave = leaveRepository.findById(leaveId)
            .orElseThrow(() -> new RuntimeException("Leave request not found"));
        validatePendingStage(leave);

        leave.setGmDecision(LeaveRequest.ApprovalDecision.REJECTED);
        leave.setGmRemarks(remarks);
        leave.setGmDecidedAt(LocalDateTime.now());
        leave.setGmId(gmId);
        finalReject(leave, remarks);

        return leaveRepository.save(leave);
    }

    @Transactional
    public LeaveRequest cancelLeaveRequest(Long leaveId, Long employeeId) {
        LeaveRequest leave = leaveRepository.findById(leaveId)
            .orElseThrow(() -> new RuntimeException("Leave request not found"));

        if (!leave.getEmployee().getId().equals(employeeId)) {
            throw new RuntimeException("You can only cancel your own leave requests");
        }

        if (leave.getStatus() == LeaveRequest.LeaveStatus.approved) {
            // Restore balance if it was already approved
            if (!"unpaid".equals(leave.getLeaveType())) {
                leaveBalanceService.restoreBalance(
                    leave.getEmployee().getId(),
                    leave.getLeaveType(),
                    leave.getDaysCount()
                );
            }
        }

        leave.setStatus(LeaveRequest.LeaveStatus.cancelled);
        leave.setApprovalStage(LeaveRequest.ApprovalStage.REJECTED);

        return leaveRepository.save(leave);
    }

    public void deleteLeaveRequest(Long id) {
        leaveRepository.deleteById(id);
    }
}
