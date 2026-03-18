package com.ghaith.erp.controller;

import com.ghaith.erp.model.Employee;
import com.ghaith.erp.model.LoanRequest;
import com.ghaith.erp.repository.EmployeeRepository;
import com.ghaith.erp.repository.LoanRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.ghaith.erp.model.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/hr/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanRequestRepository loanRepository;
    private final EmployeeRepository employeeRepository;

    @GetMapping
    public ResponseEntity<List<LoanRequest>> getAllLoans(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long employeeId) {
        if (employeeId != null) {
            return ResponseEntity.ok(loanRepository.findByEmployee_Id(employeeId));
        }
        if (branchId != null) {
            return ResponseEntity.ok(loanRepository.findAll().stream()
                    .filter(l -> l.getEmployee() != null && l.getEmployee().getBranch() != null
                            && branchId.equals(l.getEmployee().getBranch().getId()))
                    .toList());
        }
        return ResponseEntity.ok(loanRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LoanRequest> getLoan(@PathVariable Long id) {
        return loanRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<LoanRequest> createLoan(@RequestBody Map<String, Object> payload) {
        Long employeeId = ((Number) payload.get("employeeId")).longValue();
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("الموظف غير موجود"));

        BigDecimal amount = new BigDecimal(payload.get("amount").toString());
        int installments = payload.containsKey("installments") ? ((Number) payload.get("installments")).intValue() : 12;
        BigDecimal monthlyDeduction = amount.divide(BigDecimal.valueOf(installments), 2, java.math.RoundingMode.HALF_UP);

        LoanRequest loan = LoanRequest.builder()
                .employee(employee)
                .amount(amount)
                .reason(payload.get("reason") != null ? payload.get("reason").toString() : "")
                .status("pending")
                .monthlyDeduction(monthlyDeduction)
                .remainingBalance(amount)
                .installments(installments)
                .build();

        return ResponseEntity.ok(loanRepository.save(loan));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<LoanRequest> approveLoan(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {
        LoanRequest loan = loanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("طلب القرض غير موجود"));
        loan.setStatus("approved");
        if (currentUser != null) {
            loan.setApprovedBy(currentUser.getId());
        }
        loan.setApprovedAt(LocalDateTime.now());
        return ResponseEntity.ok(loanRepository.save(loan));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<LoanRequest> rejectLoan(@PathVariable Long id) {
        LoanRequest loan = loanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("طلب القرض غير موجود"));
        loan.setStatus("rejected");
        return ResponseEntity.ok(loanRepository.save(loan));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLoan(@PathVariable Long id) {
        loanRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
