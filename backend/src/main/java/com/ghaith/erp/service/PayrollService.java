package com.ghaith.erp.service;

import com.ghaith.erp.model.PayrollRecord;
import com.ghaith.erp.model.Employee;
import com.ghaith.erp.repository.PayrollRepository;
import com.ghaith.erp.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PayrollService {

        private final PayrollRepository payrollRepository;
        private final EmployeeRepository employeeRepository;

        public List<PayrollRecord> getAllPayroll() {
                return payrollRepository.findAll();
        }

        public List<PayrollRecord> getAllPayrollByBranch(Long branchId) {
                return payrollRepository.findByEmployee_BranchId(branchId);
        }

        public List<PayrollRecord> getPayrollByEmployee(Long employeeId) {
                return payrollRepository.findByEmployeeId(employeeId);
        }

        @org.springframework.transaction.annotation.Transactional
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

        // ── helpers ──────────────────────────────────────────────────────────────

        private BigDecimal toBigDecimal(Object value) {
                if (value == null)
                        return BigDecimal.ZERO;
                if (value instanceof BigDecimal)
                        return (BigDecimal) value;
                return new BigDecimal(value.toString());
        }
}
