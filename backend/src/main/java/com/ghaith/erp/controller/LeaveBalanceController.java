package com.ghaith.erp.controller;

import com.ghaith.erp.model.LeaveBalance;
import com.ghaith.erp.service.LeaveBalanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/hr/leave-balances")
@RequiredArgsConstructor
public class LeaveBalanceController {

    private final LeaveBalanceService leaveBalanceService;

    @GetMapping
    public ResponseEntity<List<LeaveBalance>> getAllBalances(
            @RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(leaveBalanceService.getAllBalances(branchId));
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<LeaveBalance>> getBalancesByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(leaveBalanceService.getBalancesByEmployee(employeeId));
    }

    @GetMapping("/check/{employeeId}/{leaveType}/{days}")
    public ResponseEntity<Map<String, Object>> checkBalance(
            @PathVariable Long employeeId,
            @PathVariable String leaveType,
            @PathVariable int days) {
        boolean hasBalance = leaveBalanceService.hasEnoughBalance(employeeId, leaveType, days);
        var balance = leaveBalanceService.getBalance(employeeId, leaveType);
        return ResponseEntity.ok(Map.of(
            "hasBalance", hasBalance,
            "remaining", balance.map(LeaveBalance::getRemainingBalance).orElse(0)
        ));
    }

    @PostMapping
    public ResponseEntity<LeaveBalance> setBalance(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(leaveBalanceService.setBalance(payload));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LeaveBalance> updateBalance(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(leaveBalanceService.updateBalance(id, payload));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBalance(@PathVariable Long id) {
        leaveBalanceService.deleteBalance(id);
        return ResponseEntity.noContent().build();
    }
}
