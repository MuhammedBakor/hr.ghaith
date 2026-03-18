package com.ghaith.erp.controller;

import com.ghaith.erp.model.PayrollDeduction;
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayroll(@PathVariable Long id) {
        payrollService.deletePayroll(id);
        return ResponseEntity.noContent().build();
    }

    /** GET /api/v1/hr/payroll/{id}/deductions */
    @GetMapping("/{id}/deductions")
    public ResponseEntity<List<PayrollDeduction>> getDeductions(@PathVariable Long id) {
        return ResponseEntity.ok(payrollService.getDeductions(id));
    }

    /** POST /api/v1/hr/payroll/{id}/deductions */
    @PostMapping("/{id}/deductions")
    public ResponseEntity<PayrollDeduction> addDeduction(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(payrollService.addDeduction(id, payload));
    }

    /** DELETE /api/v1/hr/payroll/deductions/{deductionId} */
    @DeleteMapping("/deductions/{deductionId}")
    public ResponseEntity<Void> deleteDeduction(@PathVariable Long deductionId) {
        payrollService.deleteDeduction(deductionId);
        return ResponseEntity.noContent().build();
    }

    /** POST /api/v1/hr/payroll/run-monthly — runs the 12-item algorithm for all active employees */
    @PostMapping("/run-monthly")
    public ResponseEntity<Map<String, Object>> runMonthlyPayroll(@RequestBody Map<String, Object> payload) {
        int month = payload.containsKey("month") ? ((Number) payload.get("month")).intValue()
                : java.time.LocalDate.now().getMonthValue();
        int year = payload.containsKey("year") ? ((Number) payload.get("year")).intValue()
                : java.time.LocalDate.now().getYear();
        Long branchId = payload.containsKey("branchId") && payload.get("branchId") != null
                ? ((Number) payload.get("branchId")).longValue() : null;
        return ResponseEntity.ok(payrollService.runMonthlyPayroll(month, year, branchId));
    }
}
