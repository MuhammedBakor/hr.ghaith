package com.ghaith.erp.service;

import com.ghaith.erp.model.PayrollDeduction;
import com.ghaith.erp.model.PayrollRecord;
import com.ghaith.erp.model.Employee;
import com.ghaith.erp.repository.PayrollDeductionRepository;
import com.ghaith.erp.repository.PayrollRepository;
import com.ghaith.erp.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PayrollService {

        private final PayrollRepository payrollRepository;
        private final EmployeeRepository employeeRepository;
        private final PayrollDeductionRepository payrollDeductionRepository;

        public List<PayrollRecord> getAllPayroll() {
                return payrollRepository.findAll();
        }

        public List<PayrollRecord> getAllPayrollByBranch(Long branchId) {
                return payrollRepository.findByEmployee_BranchId(branchId);
        }

        public List<PayrollRecord> getPayrollByEmployee(Long employeeId) {
                return payrollRepository.findByEmployeeId(employeeId);
        }

        @Transactional
        public PayrollRecord createPayroll(Map<String, Object> payload) {
                Long employeeId = ((Number) payload.get("employeeId")).longValue();
                Employee employee = employeeRepository.findById(employeeId)
                                .orElseThrow(() -> new RuntimeException("الموظف غير موجود"));

                PayrollRecord record = new PayrollRecord();
                record.setEmployee(employee);

                BigDecimal basicSalary = toBigDecimal(payload.get("basicSalary"));
                BigDecimal housingAllowance = toBigDecimal(payload.get("housingAllowance"));
                BigDecimal transportAllowance = toBigDecimal(payload.get("transportAllowance"));
                BigDecimal otherAllowances = toBigDecimal(payload.get("otherAllowances"));
                BigDecimal deductions = toBigDecimal(payload.get("deductions"));

                record.setBasicSalary(basicSalary);
                record.setHousingAllowance(housingAllowance);
                record.setTransportAllowance(transportAllowance);
                record.setOtherAllowances(otherAllowances);
                record.setDeductions(deductions);

                BigDecimal netSalary = basicSalary
                                .add(housingAllowance)
                                .add(transportAllowance)
                                .add(otherAllowances)
                                .subtract(deductions);
                record.setNetSalary(netSalary);

                record.setMonth(payload.get("month") != null ? payload.get("month").toString() : "");
                record.setYear(payload.get("year") != null
                                ? ((Number) payload.get("year")).intValue()
                                : java.time.Year.now().getValue());
                record.setStatus((String) payload.get("status"));

                return payrollRepository.save(record);
        }

        public PayrollRecord updateStatus(Long id, String status) {
                PayrollRecord record = payrollRepository.findById(id).orElseThrow();
                record.setStatus(status);
                return payrollRepository.save(record);
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
                LocalDate deductionDate = payload.get("deductionDate") != null
                                ? LocalDate.parse(payload.get("deductionDate").toString())
                                : LocalDate.now();

                PayrollDeduction deduction = PayrollDeduction.builder()
                                .payrollRecord(record)
                                .reason(reason)
                                .type(type)
                                .amount(amount)
                                .deductionDate(deductionDate)
                                .build();
                payrollDeductionRepository.save(deduction);

                // Update total deductions and net salary in payroll record
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

                // Subtract this deduction from totals
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

        // ── helpers ──────────────────────────────────────────────────────────────

        private BigDecimal toBigDecimal(Object value) {
                if (value == null)
                        return BigDecimal.ZERO;
                if (value instanceof BigDecimal)
                        return (BigDecimal) value;
                return new BigDecimal(value.toString());
        }
}
