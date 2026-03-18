package com.ghaith.erp.service;

import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollService {

    private final PayrollRepository payrollRepository;
    private final EmployeeRepository employeeRepository;
    private final PayrollDeductionRepository payrollDeductionRepository;
    private final AttendanceDeductionRepository attendanceDeductionRepository;
    private final AttendanceRepository attendanceRepository;
    private final EmployeePenaltyRepository employeePenaltyRepository;
    private final LoanRequestRepository loanRequestRepository;
    private final OvertimeRequestRepository overtimeRequestRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    public List<PayrollRecord> getAllPayroll() {
        return payrollRepository.findAll();
    }

    public List<PayrollRecord> getAllPayrollByBranch(Long branchId) {
        return payrollRepository.findByEmployee_BranchId(branchId);
    }

    public List<PayrollRecord> getPayrollByEmployee(Long employeeId) {
        return payrollRepository.findByEmployeeId(employeeId);
    }

    /**
     * Creates a payroll record. If the payload contains only employeeId, month, year and status,
     * the 12-item algorithm is run automatically to compute all deduction components.
     */
    @Transactional
    public PayrollRecord createPayroll(Map<String, Object> payload) {
        Long employeeId = ((Number) payload.get("employeeId")).longValue();
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("الموظف غير موجود"));

        String monthStr = payload.get("month") != null ? payload.get("month").toString() : "";
        int year = payload.get("year") != null
                ? ((Number) payload.get("year")).intValue()
                : java.time.Year.now().getValue();

        // Parse month number (1-12) from the month string
        int monthNum = parseMonthNumber(monthStr, year);
        String paddedMonth = String.format("%02d", monthNum);

        PayrollRecord record = new PayrollRecord();
        record.setEmployee(employee);
        record.setMonth(monthStr);
        record.setYear(year);
        record.setStatus((String) payload.get("status"));

        // — Salary components —
        BigDecimal basicSalary = getOrCompute(payload, "basicSalary",
                employee.getSalary() != null ? employee.getSalary() : BigDecimal.ZERO);
        BigDecimal housingAllowance = getOrCompute(payload, "housingAllowance",
                employee.getHousingAllowance() != null ? employee.getHousingAllowance() : BigDecimal.ZERO);
        BigDecimal transportAllowance = getOrCompute(payload, "transportAllowance",
                employee.getTransportAllowance() != null ? employee.getTransportAllowance() : BigDecimal.ZERO);
        BigDecimal otherAllowances = getOrCompute(payload, "otherAllowances", BigDecimal.ZERO);

        record.setBasicSalary(basicSalary);
        record.setHousingAllowance(housingAllowance);
        record.setTransportAllowance(transportAllowance);
        record.setOtherAllowances(otherAllowances);

        BigDecimal grossSalary = basicSalary.add(housingAllowance).add(transportAllowance).add(otherAllowances);

        // — 12-item algorithm —
        // Item 1: Late deductions (from attendance_deductions, type=late_penalty)
        BigDecimal lateDeduction = orZero(attendanceDeductionRepository
                .sumByEmployeeAndMonthAndType(employeeId, paddedMonth, year, "late_penalty"));

        // Item 2: Absence deductions — count absent days × (basicSalary / 30)
        BigDecimal dailyRate = basicSalary.divide(BigDecimal.valueOf(30), 2, RoundingMode.HALF_UP);
        long absentDays = countAbsentDays(employeeId, monthNum, year);
        BigDecimal absenceDeduction = dailyRate.multiply(BigDecimal.valueOf(absentDays));

        // Item 3: Unpaid leave deductions — count unpaid-leave days × dailyRate
        long unpaidLeaveDays = countUnpaidLeaveDays(employeeId, monthNum, year);
        BigDecimal unpaidLeaveDeduction = dailyRate.multiply(BigDecimal.valueOf(unpaidLeaveDays));

        // Item 4: Penalty deductions (from employee_penalties, status=approved, effective this month)
        BigDecimal penaltyDeduction = orZero(employeePenaltyRepository
                .sumApprovedDeductionsByEmployeeAndMonth(employeeId, monthNum, year));

        // Item 5: Loan installment
        BigDecimal loanInstallment = computeLoanInstallment(employeeId);

        // Item 6: GOSI deduction — 9.75% of basicSalary
        BigDecimal gosiDeduction = basicSalary.multiply(new BigDecimal("0.0975"))
                .setScale(2, RoundingMode.HALF_UP);

        // Item 7: Overtime addition — approved OT hours × (basicSalary/30/8) × 1.5
        BigDecimal overtimeAddition = computeOvertimeAddition(employeeId, monthNum, year, dailyRate);

        // Item 8: Manual deductions from payroll_deductions table (if any already exist)
        BigDecimal manualDeduction = BigDecimal.ZERO;
        if (payload.containsKey("deductions") && payload.get("deductions") != null) {
            manualDeduction = toBigDecimal(payload.get("deductions"));
        }

        // Total deductions
        BigDecimal totalDeductions = lateDeduction
                .add(absenceDeduction)
                .add(unpaidLeaveDeduction)
                .add(penaltyDeduction)
                .add(loanInstallment)
                .add(gosiDeduction)
                .add(manualDeduction);

        record.setDeductions(totalDeductions);

        // Net salary
        BigDecimal netSalary = grossSalary.add(overtimeAddition).subtract(totalDeductions);
        record.setNetSalary(netSalary);

        PayrollRecord saved = payrollRepository.save(record);

        // Store the breakdown as payroll deductions for display
        saveBreakdownDeductions(saved, lateDeduction, absenceDeduction, unpaidLeaveDeduction,
                penaltyDeduction, loanInstallment, gosiDeduction, overtimeAddition);

        log.info("Payroll created for employee {} month={}/{}: gross={}, deductions={}, net={}",
                employeeId, monthNum, year, grossSalary, totalDeductions, netSalary);

        return saved;
    }

    /**
     * Run monthly payroll for all active employees in a branch.
     */
    @Transactional
    public Map<String, Object> runMonthlyPayroll(int month, int year, Long branchId) {
        List<Employee> employees = branchId != null
                ? employeeRepository.findByBranch_Id(branchId)
                : employeeRepository.findAll();

        int created = 0;
        int skipped = 0;
        for (Employee emp : employees) {
            if (emp.getStatus() != Employee.EmployeeStatus.active) {
                skipped++;
                continue;
            }
            // Skip if payroll already exists for this month/year
            List<PayrollRecord> existing = payrollRepository.findByEmployeeId(emp.getId())
                    .stream()
                    .filter(p -> p.getYear() == year && monthMatches(p.getMonth(), month))
                    .toList();
            if (!existing.isEmpty()) {
                skipped++;
                continue;
            }

            try {
                Map<String, Object> payload = new HashMap<>();
                payload.put("employeeId", emp.getId());
                payload.put("month", String.format("%02d", month));
                payload.put("year", year);
                payload.put("status", "draft");
                createPayroll(payload);
                created++;
            } catch (Exception e) {
                log.error("Failed to create payroll for employee {}: {}", emp.getId(), e.getMessage());
                skipped++;
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("created", created);
        result.put("skipped", skipped);
        result.put("month", month);
        result.put("year", year);
        return result;
    }

    public PayrollRecord updateStatus(Long id, String status) {
        PayrollRecord record = payrollRepository.findById(id).orElseThrow();
        record.setStatus(status);

        // If approving, mark attendance deductions and loan installments as included
        if ("approved".equals(status)) {
            onPayrollApproved(record);
        }

        return payrollRepository.save(record);
    }

    @Transactional
    private void onPayrollApproved(PayrollRecord record) {
        Long employeeId = record.getEmployee().getId();
        int monthNum = parseMonthNumber(record.getMonth(), record.getYear());
        String paddedMonth = String.format("%02d", monthNum);

        // Mark attendance deductions as included
        List<AttendanceDeduction> attDeds = attendanceDeductionRepository
                .findByEmployee_IdAndMonthAndYear(employeeId, paddedMonth, record.getYear());
        for (AttendanceDeduction d : attDeds) {
            d.setPayrollStatus("included");
            attendanceDeductionRepository.save(d);
        }

        // Update loan remaining balance
        List<LoanRequest> loans = loanRequestRepository.findByEmployee_IdAndStatus(employeeId, "approved");
        for (LoanRequest loan : loans) {
            if (loan.getRemainingBalance() != null && loan.getMonthlyDeduction() != null) {
                BigDecimal newBalance = loan.getRemainingBalance().subtract(loan.getMonthlyDeduction());
                if (newBalance.compareTo(BigDecimal.ZERO) <= 0) {
                    loan.setRemainingBalance(BigDecimal.ZERO);
                    loan.setStatus("paid_off");
                } else {
                    loan.setRemainingBalance(newBalance);
                }
                loanRequestRepository.save(loan);
            }
        }

        // Mark penalties as executed
        List<EmployeePenalty> penalties = employeePenaltyRepository.findByEmployee_Id(employeeId)
                .stream()
                .filter(p -> "approved".equals(p.getStatus())
                        && p.getEffectiveDate() != null
                        && p.getEffectiveDate().getMonthValue() == monthNum
                        && p.getEffectiveDate().getYear() == record.getYear())
                .toList();
        for (EmployeePenalty penalty : penalties) {
            penalty.setStatus("executed");
            penalty.setExecutedInPayrollId(record.getId());
            employeePenaltyRepository.save(penalty);
        }
    }

    public void deletePayroll(Long id) {
        if (!payrollRepository.existsById(id)) {
            throw new RuntimeException("كشف الراتب غير موجود");
        }
        payrollRepository.deleteById(id);
    }

    // ── deduction methods ────────────────────────────────────────────────────

    public List<PayrollDeduction> getDeductions(Long payrollRecordId) {
        return payrollDeductionRepository.findByPayrollRecord_Id(payrollRecordId);
    }

    @Transactional
    public PayrollDeduction addDeduction(Long payrollRecordId, Map<String, Object> payload) {
        PayrollRecord record = payrollRepository.findById(payrollRecordId)
                .orElseThrow(() -> new RuntimeException("كشف الراتب غير موجود"));

        BigDecimal amount = toBigDecimal(payload.get("amount"));
        String reason = payload.get("reason") != null ? payload.get("reason").toString() : "خصم";
        String type = payload.get("type") != null ? payload.get("type").toString() : "other";
        java.time.LocalDate deductionDate = payload.get("deductionDate") != null
                ? java.time.LocalDate.parse(payload.get("deductionDate").toString())
                : java.time.LocalDate.now();

        PayrollDeduction deduction = PayrollDeduction.builder()
                .payrollRecord(record)
                .reason(reason)
                .type(type)
                .amount(amount)
                .deductionDate(deductionDate)
                .build();
        payrollDeductionRepository.save(deduction);

        BigDecimal totalDeductions = (record.getDeductions() != null ? record.getDeductions() : BigDecimal.ZERO)
                .add(amount);
        record.setDeductions(totalDeductions);
        BigDecimal basicSalary = record.getBasicSalary() != null ? record.getBasicSalary() : BigDecimal.ZERO;
        BigDecimal housing = record.getHousingAllowance() != null ? record.getHousingAllowance() : BigDecimal.ZERO;
        BigDecimal transport = record.getTransportAllowance() != null ? record.getTransportAllowance() : BigDecimal.ZERO;
        BigDecimal other = record.getOtherAllowances() != null ? record.getOtherAllowances() : BigDecimal.ZERO;
        record.setNetSalary(basicSalary.add(housing).add(transport).add(other).subtract(totalDeductions));
        payrollRepository.save(record);

        return deduction;
    }

    @Transactional
    public void deleteDeduction(Long deductionId) {
        PayrollDeduction deduction = payrollDeductionRepository.findById(deductionId)
                .orElseThrow(() -> new RuntimeException("الخصم غير موجود"));
        PayrollRecord record = deduction.getPayrollRecord();

        BigDecimal newDeductions = (record.getDeductions() != null ? record.getDeductions() : BigDecimal.ZERO)
                .subtract(deduction.getAmount());
        if (newDeductions.compareTo(BigDecimal.ZERO) < 0) newDeductions = BigDecimal.ZERO;
        record.setDeductions(newDeductions);
        BigDecimal basicSalary = record.getBasicSalary() != null ? record.getBasicSalary() : BigDecimal.ZERO;
        BigDecimal housing = record.getHousingAllowance() != null ? record.getHousingAllowance() : BigDecimal.ZERO;
        BigDecimal transport = record.getTransportAllowance() != null ? record.getTransportAllowance() : BigDecimal.ZERO;
        BigDecimal other = record.getOtherAllowances() != null ? record.getOtherAllowances() : BigDecimal.ZERO;
        record.setNetSalary(basicSalary.add(housing).add(transport).add(other).subtract(newDeductions));
        payrollRepository.save(record);

        payrollDeductionRepository.deleteById(deductionId);
    }

    // ── private helpers ──────────────────────────────────────────────────────

    private long countAbsentDays(Long employeeId, int month, int year) {
        java.time.LocalDateTime start = java.time.LocalDateTime.of(year, month, 1, 0, 0);
        java.time.LocalDateTime end = start.plusMonths(1).minusSeconds(1);
        return attendanceRepository.countAbsentByEmployeeAndPeriod(employeeId, start, end);
    }

    private long countUnpaidLeaveDays(Long employeeId, int month, int year) {
        LocalDate monthStart = LocalDate.of(year, month, 1);
        LocalDate monthEnd = monthStart.withDayOfMonth(monthStart.lengthOfMonth());

        return leaveRequestRepository.findByEmployeeId(employeeId).stream()
                .filter(lr -> "unpaid".equals(lr.getLeaveType())
                        && lr.getStatus() == LeaveRequest.LeaveStatus.approved
                        && lr.getStartDate() != null && lr.getEndDate() != null
                        && !lr.getStartDate().isAfter(monthEnd)
                        && !lr.getEndDate().isBefore(monthStart))
                .mapToLong(lr -> {
                    LocalDate effectiveStart = lr.getStartDate().isBefore(monthStart) ? monthStart : lr.getStartDate();
                    LocalDate effectiveEnd = lr.getEndDate().isAfter(monthEnd) ? monthEnd : lr.getEndDate();
                    return java.time.temporal.ChronoUnit.DAYS.between(effectiveStart, effectiveEnd) + 1;
                })
                .sum();
    }

    private BigDecimal computeLoanInstallment(Long employeeId) {
        return loanRequestRepository.findByEmployee_IdAndStatus(employeeId, "approved")
                .stream()
                .filter(l -> l.getRemainingBalance() != null && l.getRemainingBalance().compareTo(BigDecimal.ZERO) > 0
                        && l.getMonthlyDeduction() != null)
                .map(LoanRequest::getMonthlyDeduction)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal computeOvertimeAddition(Long employeeId, int month, int year, BigDecimal dailyRate) {
        Double otHours = overtimeRequestRepository.sumApprovedHoursByEmployeeAndMonth(employeeId, month, year);
        if (otHours == null || otHours <= 0) return BigDecimal.ZERO;

        // hourly rate = dailyRate / 8
        BigDecimal hourlyRate = dailyRate.divide(BigDecimal.valueOf(8), 4, RoundingMode.HALF_UP);
        return hourlyRate.multiply(BigDecimal.valueOf(otHours))
                .multiply(new BigDecimal("1.5"))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private void saveBreakdownDeductions(PayrollRecord record,
            BigDecimal lateDeduction, BigDecimal absenceDeduction,
            BigDecimal unpaidLeaveDeduction, BigDecimal penaltyDeduction,
            BigDecimal loanInstallment, BigDecimal gosiDeduction,
            BigDecimal overtimeAddition) {

        saveIfNonZero(record, lateDeduction, "late_penalty", "خصم تأخر");
        saveIfNonZero(record, absenceDeduction, "absence", "خصم غياب");
        saveIfNonZero(record, unpaidLeaveDeduction, "unpaid_leave", "خصم إجازة بدون راتب");
        saveIfNonZero(record, penaltyDeduction, "penalty", "خصم جزاء");
        saveIfNonZero(record, loanInstallment, "loan", "قسط قرض");
        saveIfNonZero(record, gosiDeduction, "gosi", "خصم التأمينات الاجتماعية (9.75%)");
        if (overtimeAddition.compareTo(BigDecimal.ZERO) > 0) {
            payrollDeductionRepository.save(PayrollDeduction.builder()
                    .payrollRecord(record)
                    .reason("إضافة أوفرتايم")
                    .type("overtime_addition")
                    .amount(overtimeAddition.negate()) // negative = addition
                    .deductionDate(LocalDate.now())
                    .build());
        }
    }

    private void saveIfNonZero(PayrollRecord record, BigDecimal amount, String type, String reason) {
        if (amount.compareTo(BigDecimal.ZERO) > 0) {
            payrollDeductionRepository.save(PayrollDeduction.builder()
                    .payrollRecord(record)
                    .reason(reason)
                    .type(type)
                    .amount(amount)
                    .deductionDate(LocalDate.now())
                    .build());
        }
    }

    private int parseMonthNumber(String monthStr, int year) {
        if (monthStr == null || monthStr.isBlank()) {
            return java.time.LocalDate.now().getMonthValue();
        }
        try {
            int m = Integer.parseInt(monthStr.trim());
            if (m >= 1 && m <= 12) return m;
        } catch (NumberFormatException ignored) {
        }
        // try parsing as month name
        try {
            return java.time.Month.valueOf(monthStr.trim().toUpperCase()).getValue();
        } catch (IllegalArgumentException ignored) {
        }
        return java.time.LocalDate.now().getMonthValue();
    }

    private boolean monthMatches(String storedMonth, int targetMonth) {
        if (storedMonth == null) return false;
        try {
            return Integer.parseInt(storedMonth.trim()) == targetMonth;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private BigDecimal getOrCompute(Map<String, Object> payload, String key, BigDecimal defaultValue) {
        if (payload.containsKey(key) && payload.get(key) != null) {
            return toBigDecimal(payload.get(key));
        }
        return defaultValue;
    }

    private BigDecimal orZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        return new BigDecimal(value.toString());
    }
}
