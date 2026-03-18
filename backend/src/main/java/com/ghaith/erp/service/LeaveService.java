package com.ghaith.erp.service;

import com.ghaith.erp.model.AuditLog;
import com.ghaith.erp.model.LeaveRequest;
import com.ghaith.erp.model.Employee;
import com.ghaith.erp.repository.LeaveRequestRepository;
import com.ghaith.erp.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@Slf4j
public class LeaveService {

    private final LeaveRequestRepository leaveRepository;
    private final EmployeeRepository employeeRepository;
    private final LeaveBalanceService leaveBalanceService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

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
    public Map<String, Object> createLeaveRequest(java.util.Map<String, Object> payload) {
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
        String documentUrl = payload.get("documentUrl") != null ? payload.get("documentUrl").toString() : null;

        // Validation 1 — Balance check (skip for unpaid)
        if (!"unpaid".equals(leaveType)) {
            if (!leaveBalanceService.hasEnoughBalance(employeeId, leaveType, daysCount)) {
                throw new RuntimeException("INSUFFICIENT_BALANCE:لا يوجد رصيد كافي من الإجازات. الرجاء مراجعة رصيد إجازاتك.");
            }
        }

        // Validation 2 — Overlap check
        long overlapping = leaveRepository.countOverlappingLeaves(employeeId, startDate, endDate);
        if (overlapping > 0) {
            throw new RuntimeException("OVERLAP:يوجد طلب إجازة آخر متداخل مع هذه الفترة");
        }

        // Validation 3 — Gender check (maternity only for female)
        if ("maternity".equals(leaveType) && !"female".equalsIgnoreCase(employee.getGender())) {
            throw new RuntimeException("GENDER_MISMATCH:إجازة الأمومة متاحة للموظفات فقط");
        }

        // Validation 4 — Hajj one-time check
        if ("hajj".equals(leaveType)) {
            long hajjCount = leaveRepository.countHajjLeaves(employeeId);
            if (hajjCount > 0) {
                throw new RuntimeException("HAJJ_DUPLICATE:تم الاستفادة من إجازة الحج مسبقاً، لا يحق الحصول عليها مرة أخرى");
            }
        }

        // Validation 5 — Document requirement (sick/maternity > 3 days requires document)
        boolean requiresDocument = ("sick".equals(leaveType) || "maternity".equals(leaveType)) && daysCount > 3;
        if (requiresDocument && (documentUrl == null || documentUrl.isBlank())) {
            throw new RuntimeException("DOCUMENT_REQUIRED:يجب إرفاق وثيقة طبية للإجازة المرضية التي تزيد عن 3 أيام");
        }

        // Validation 6 — Department absence cap (30% warning, not block)
        boolean deptCapWarning = false;
        if (employee.getDepartment() != null) {
            Long deptId = employee.getDepartment().getId();
            long activeLeavesInDept = leaveRepository.countActiveLeavesInDepartment(deptId, startDate, endDate);
            long deptSize = employeeRepository.findByDepartmentId(deptId).size();
            if (deptSize > 0 && (double) activeLeavesInDept / deptSize >= 0.30) {
                deptCapWarning = true;
                log.warn("Department {} has {}% leave rate during requested period — cap warning for employee {}",
                        deptId, Math.round((double) activeLeavesInDept / deptSize * 100), employeeId);
            }
        }

        // Build leave request
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setEmployee(employee);
        leaveRequest.setLeaveType(leaveType);
        leaveRequest.setStartDate(startDate);
        leaveRequest.setEndDate(endDate);
        leaveRequest.setReason((String) payload.get("reason"));
        leaveRequest.setDocumentUrl(documentUrl);
        leaveRequest.setStatus(LeaveRequest.LeaveStatus.pending);
        leaveRequest.setApprovalStage(LeaveRequest.ApprovalStage.PENDING);
        leaveRequest.setDaysCount(daysCount);
        leaveRequest.setEscalationDeadline(LocalDateTime.now().plusHours(24));

        // Auto-generate request number
        leaveRequest.setRequestNumber("LR-" + System.currentTimeMillis());

        LeaveRequest saved = leaveRepository.save(leaveRequest);

        // Notify employee (confirmation)
        if (employee.getUser() != null) {
            notificationService.createNotification(
                    employee.getUser().getId(),
                    "تم استلام طلب إجازتك",
                    "تم تقديم طلب إجازتك بنجاح من " + startDate + " إلى " + endDate + " (" + daysCount + " أيام)",
                    "leave_submitted",
                    saved.getId(),
                    "LeaveRequest");
        }

        // Notify manager
        Employee manager = employee.getManager();
        if (manager != null && manager.getUser() != null) {
            String empName = employee.getFirstName() + " " + employee.getLastName();
            notificationService.createNotification(
                    manager.getUser().getId(),
                    "طلب إجازة جديد يحتاج موافقتك",
                    "الموظف " + empName + " طلب إجازة " + leaveType + " من " + startDate + " إلى " + endDate,
                    "leave_approval_required",
                    saved.getId(),
                    "LeaveRequest");
        }

        // Audit log
        try {
            auditLogService.createLog(AuditLog.builder()
                    .module("LeaveRequest")
                    .eventType("CREATE_LEAVE_REQUEST")
                    .description("type=" + leaveType + ", days=" + daysCount + ", start=" + startDate)
                    .userId(employee.getUser() != null ? employee.getUser().getId() : null)
                    .entityId(saved.getId())
                    .severity("info")
                    .build());
        } catch (Exception e) {
            log.warn("Failed to write audit log for leave request {}: {}", saved.getId(), e.getMessage());
        }

        Map<String, Object> result = new HashMap<>();
        result.put("leaveRequest", saved);
        result.put("deptCapWarning", deptCapWarning);
        return result;
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

        // Notify employee of approval
        Employee emp = leave.getEmployee();
        if (emp.getUser() != null) {
            notificationService.createNotification(
                    emp.getUser().getId(),
                    "تمت الموافقة على طلب إجازتك",
                    "تمت الموافقة على طلب إجازتك من " + leave.getStartDate() + " إلى " + leave.getEndDate(),
                    "leave_approved",
                    leave.getId(),
                    "LeaveRequest");
        }
    }

    private void finalReject(LeaveRequest leave, String remarks) {
        leave.setApprovalStage(LeaveRequest.ApprovalStage.REJECTED);
        leave.setStatus(LeaveRequest.LeaveStatus.rejected);
        leave.setManagerRemarks(remarks);

        // Notify employee of rejection
        Employee emp = leave.getEmployee();
        if (emp.getUser() != null) {
            notificationService.createNotification(
                    emp.getUser().getId(),
                    "تم رفض طلب إجازتك",
                    "تم رفض طلب إجازتك من " + leave.getStartDate() + " إلى " + leave.getEndDate()
                            + (remarks != null && !remarks.isBlank() ? ". السبب: " + remarks : ""),
                    "leave_rejected",
                    leave.getId(),
                    "LeaveRequest");
        }
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
