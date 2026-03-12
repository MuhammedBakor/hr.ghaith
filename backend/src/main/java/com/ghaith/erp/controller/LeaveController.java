package com.ghaith.erp.controller;

import com.ghaith.erp.model.LeaveRequest;
import com.ghaith.erp.service.LeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/hr/leaves")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    @GetMapping
    public ResponseEntity<List<LeaveRequest>> getAllLeaveRequests(
            @RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(leaveService.getAllLeaveRequests(branchId));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<LeaveRequest>> getLeaveRequestsByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(leaveService.getLeaveRequestsByEmployee(employeeId));
    }

    @GetMapping("/employee/{employeeId}/stats")
    public ResponseEntity<Map<String, Object>> getEmployeeLeaveStats(@PathVariable Long employeeId) {
        return ResponseEntity.ok(leaveService.getEmployeeLeaveStats(employeeId));
    }

    @GetMapping("/department/{departmentId}")
    public ResponseEntity<List<LeaveRequest>> getLeaveRequestsByDepartment(
            @PathVariable Long departmentId,
            @RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(leaveService.getLeaveRequestsByDepartment(departmentId, branchId));
    }

    @GetMapping("/stage/{stage}")
    public ResponseEntity<List<LeaveRequest>> getLeaveRequestsByStage(
            @PathVariable String stage,
            @RequestParam(required = false) Long branchId) {
        LeaveRequest.ApprovalStage approvalStage = LeaveRequest.ApprovalStage.valueOf(stage);
        return ResponseEntity.ok(leaveService.getLeaveRequestsByApprovalStage(approvalStage, branchId));
    }

    @GetMapping("/department/{departmentId}/stage/{stage}")
    public ResponseEntity<List<LeaveRequest>> getByDepartmentAndStage(
            @PathVariable Long departmentId,
            @PathVariable String stage,
            @RequestParam(required = false) Long branchId) {
        LeaveRequest.ApprovalStage approvalStage = LeaveRequest.ApprovalStage.valueOf(stage);
        return ResponseEntity.ok(leaveService.getLeaveRequestsByDepartmentAndStage(departmentId, approvalStage, branchId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeaveRequest> getLeaveRequestById(@PathVariable Long id) {
        return leaveService.getLeaveRequestById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createLeaveRequest(@RequestBody Map<String, Object> payload) {
        try {
            return ResponseEntity.ok(leaveService.createLeaveRequest(payload));
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().startsWith("INSUFFICIENT_BALANCE:")) {
                String msg = e.getMessage().substring("INSUFFICIENT_BALANCE:".length());
                return ResponseEntity.badRequest().body(Map.of("error", "INSUFFICIENT_BALANCE", "message", msg));
            }
            return ResponseEntity.badRequest().body(Map.of("error", "ERROR", "message", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<LeaveRequest> updateLeaveRequest(@PathVariable Long id,
            @RequestBody LeaveRequest leaveRequest) {
        try {
            return ResponseEntity.ok(leaveService.updateLeaveRequest(id, leaveRequest));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Approval workflow endpoints
    @PostMapping("/{id}/approve/dept-manager")
    public ResponseEntity<?> approveByDeptManager(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Number managerId = (Number) payload.get("managerId");
            String remarks = (String) payload.get("remarks");
            return ResponseEntity.ok(leaveService.approveByDeptManager(id, managerId.longValue(), remarks));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject/dept-manager")
    public ResponseEntity<?> rejectByDeptManager(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Number managerId = (Number) payload.get("managerId");
            String remarks = (String) payload.get("remarks");
            return ResponseEntity.ok(leaveService.rejectByDeptManager(id, managerId.longValue(), remarks));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve/hr-manager")
    public ResponseEntity<?> approveByHrManager(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Number managerId = (Number) payload.get("managerId");
            String remarks = (String) payload.get("remarks");
            return ResponseEntity.ok(leaveService.approveByHrManager(id, managerId.longValue(), remarks));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject/hr-manager")
    public ResponseEntity<?> rejectByHrManager(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Number managerId = (Number) payload.get("managerId");
            String remarks = (String) payload.get("remarks");
            return ResponseEntity.ok(leaveService.rejectByHrManager(id, managerId.longValue(), remarks));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve/gm")
    public ResponseEntity<?> approveByGM(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Number managerId = (Number) payload.get("managerId");
            String remarks = (String) payload.get("remarks");
            return ResponseEntity.ok(leaveService.approveByGM(id, managerId.longValue(), remarks));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject/gm")
    public ResponseEntity<?> rejectByGM(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Number managerId = (Number) payload.get("managerId");
            String remarks = (String) payload.get("remarks");
            return ResponseEntity.ok(leaveService.rejectByGM(id, managerId.longValue(), remarks));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelLeaveRequest(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Number employeeId = (Number) payload.get("employeeId");
            return ResponseEntity.ok(leaveService.cancelLeaveRequest(id, employeeId.longValue()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLeaveRequest(@PathVariable Long id) {
        leaveService.deleteLeaveRequest(id);
        return ResponseEntity.noContent().build();
    }
}
