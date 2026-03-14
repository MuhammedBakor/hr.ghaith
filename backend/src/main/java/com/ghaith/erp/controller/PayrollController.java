package com.ghaith.erp.controller;

import com.ghaith.erp.model.PayrollRecord;
import com.ghaith.erp.service.PayrollService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/hr/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;

    @GetMapping
    public ResponseEntity<List<PayrollRecord>> getAllPayroll(
            @RequestParam(required = false) Long branchId) {
        if (branchId != null) {
            return ResponseEntity.ok(payrollService.getAllPayrollByBranch(branchId));
        }
        return ResponseEntity.ok(payrollService.getAllPayroll());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<PayrollRecord>> getPayrollByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(payrollService.getPayrollByEmployee(employeeId));
    }

    @PostMapping
    public ResponseEntity<PayrollRecord> createPayroll(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(payrollService.createPayroll(payload));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PayrollRecord> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(payrollService.updateStatus(id, payload.get("status")));
    }
}
