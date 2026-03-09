package com.ghaith.erp.service;

import com.ghaith.erp.model.LeaveBalance;
import com.ghaith.erp.model.Employee;
import com.ghaith.erp.repository.LeaveBalanceRepository;
import com.ghaith.erp.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LeaveBalanceService {

    private final LeaveBalanceRepository leaveBalanceRepository;
    private final EmployeeRepository employeeRepository;

    public List<LeaveBalance> getAllBalances() {
        return leaveBalanceRepository.findAll();
    }

    public List<LeaveBalance> getBalancesByEmployee(Long employeeId) {
        return leaveBalanceRepository.findByEmployeeId(employeeId);
    }

    public Optional<LeaveBalance> getBalance(Long employeeId, String leaveType) {
        return leaveBalanceRepository.findByEmployeeIdAndLeaveType(employeeId, leaveType);
    }

    public LeaveBalance setBalance(java.util.Map<String, Object> payload) {
        Number empIdNum = (Number) payload.get("employeeId");
        String leaveType = (String) payload.get("leaveType");
        Number totalBalanceNum = (Number) payload.get("totalBalance");

        if (empIdNum == null || leaveType == null || totalBalanceNum == null) {
            throw new RuntimeException("employeeId, leaveType, and totalBalance are required");
        }

        Long employeeId = empIdNum.longValue();
        Integer totalBalance = totalBalanceNum.intValue();

        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found with id " + employeeId));

        // Check if balance already exists for this employee and leave type
        Optional<LeaveBalance> existing = leaveBalanceRepository
            .findByEmployeeIdAndLeaveType(employeeId, leaveType);

        if (existing.isPresent()) {
            LeaveBalance balance = existing.get();
            balance.setTotalBalance(totalBalance);
            return leaveBalanceRepository.save(balance);
        } else {
            LeaveBalance balance = LeaveBalance.builder()
                .employee(employee)
                .leaveType(leaveType)
                .totalBalance(totalBalance)
                .usedBalance(0)
                .build();
            return leaveBalanceRepository.save(balance);
        }
    }

    public LeaveBalance updateBalance(Long id, java.util.Map<String, Object> payload) {
        LeaveBalance balance = leaveBalanceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Leave balance not found with id " + id));

        if (payload.containsKey("totalBalance")) {
            Number totalBalanceNum = (Number) payload.get("totalBalance");
            balance.setTotalBalance(totalBalanceNum.intValue());
        }
        if (payload.containsKey("usedBalance")) {
            Number usedBalanceNum = (Number) payload.get("usedBalance");
            balance.setUsedBalance(usedBalanceNum.intValue());
        }

        return leaveBalanceRepository.save(balance);
    }

    public void deductBalance(Long employeeId, String leaveType, int days) {
        LeaveBalance balance = leaveBalanceRepository
            .findByEmployeeIdAndLeaveType(employeeId, leaveType)
            .orElseThrow(() -> new RuntimeException("No leave balance found for employee " + employeeId + " and type " + leaveType));

        if (balance.getRemainingBalance() < days) {
            throw new RuntimeException("Insufficient leave balance. Remaining: " + balance.getRemainingBalance() + ", Requested: " + days);
        }

        balance.setUsedBalance(balance.getUsedBalance() + days);
        leaveBalanceRepository.save(balance);
    }

    public void restoreBalance(Long employeeId, String leaveType, int days) {
        leaveBalanceRepository.findByEmployeeIdAndLeaveType(employeeId, leaveType)
            .ifPresent(balance -> {
                balance.setUsedBalance(Math.max(0, balance.getUsedBalance() - days));
                leaveBalanceRepository.save(balance);
            });
    }

    public boolean hasEnoughBalance(Long employeeId, String leaveType, int days) {
        Optional<LeaveBalance> balance = leaveBalanceRepository
            .findByEmployeeIdAndLeaveType(employeeId, leaveType);
        if (balance.isEmpty()) {
            return false;
        }
        return balance.get().getRemainingBalance() >= days;
    }

    public void deleteBalance(Long id) {
        leaveBalanceRepository.deleteById(id);
    }
}
