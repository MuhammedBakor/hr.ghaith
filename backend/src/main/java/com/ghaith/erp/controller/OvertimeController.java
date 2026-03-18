package com.ghaith.erp.controller;

import com.ghaith.erp.model.Employee;
import com.ghaith.erp.model.OvertimeRequest;
import com.ghaith.erp.model.User;
import com.ghaith.erp.repository.EmployeeRepository;
import com.ghaith.erp.repository.OvertimeRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/hr/overtime")
@RequiredArgsConstructor
public class OvertimeController {

    private final OvertimeRequestRepository overtimeRepository;
    private final EmployeeRepository employeeRepository;

    @GetMapping
    public ResponseEntity<List<OvertimeRequest>> getAllOvertime(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long employeeId) {
        if (employeeId != null) {
            return ResponseEntity.ok(overtimeRepository.findByEmployee_Id(employeeId));
        }
        if (branchId != null) {
            return ResponseEntity.ok(overtimeRepository.findAll().stream()
                    .filter(o -> o.getEmployee() != null && o.getEmployee().getBranch() != null
                            && branchId.equals(o.getEmployee().getBranch().getId()))
                    .toList());
        }
        return ResponseEntity.ok(overtimeRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<OvertimeRequest> createOvertime(@RequestBody Map<String, Object> payload) {
        Long employeeId = ((Number) payload.get("employeeId")).longValue();
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("الموظف غير موجود"));

        LocalDate date = payload.get("date") != null
                ? LocalDate.parse(payload.get("date").toString())
                : LocalDate.now();
        double hours = ((Number) payload.get("hours")).doubleValue();

        OvertimeRequest overtime = OvertimeRequest.builder()
                .employee(employee)
                .date(date)
                .hours(hours)
                .status("pending")
                .multiplier(1.5)
                .build();

        return ResponseEntity.ok(overtimeRepository.save(overtime));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<OvertimeRequest> approveOvertime(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        OvertimeRequest overtime = overtimeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("طلب الأوفرتايم غير موجود"));
        overtime.setStatus("approved");
        if (currentUser != null) {
            overtime.setApprovedBy(currentUser.getId());
        }
        return ResponseEntity.ok(overtimeRepository.save(overtime));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<OvertimeRequest> rejectOvertime(@PathVariable Long id) {
        OvertimeRequest overtime = overtimeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("طلب الأوفرتايم غير موجود"));
        overtime.setStatus("rejected");
        return ResponseEntity.ok(overtimeRepository.save(overtime));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOvertime(@PathVariable Long id) {
        overtimeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
