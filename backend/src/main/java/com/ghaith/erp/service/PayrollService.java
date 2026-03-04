package com.ghaith.erp.service;

import com.ghaith.erp.model.PayrollRecord;
import com.ghaith.erp.model.Employee;
import com.ghaith.erp.repository.PayrollRepository;
import com.ghaith.erp.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
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

        record.setBasicSalary(
                payload.get("basicSalary") != null ? ((Number) payload.get("basicSalary")).doubleValue() : 0.0);
        record.setHousingAllowance(
                payload.get("housingAllowance") != null ? ((Number) payload.get("housingAllowance")).doubleValue()
                        : 0.0);
        record.setTransportAllowance(
                payload.get("transportAllowance") != null ? ((Number) payload.get("transportAllowance")).doubleValue()
                        : 0.0);
        record.setOtherAllowances(
                payload.get("otherAllowances") != null ? ((Number) payload.get("otherAllowances")).doubleValue() : 0.0);
        record.setDeductions(
                payload.get("deductions") != null ? ((Number) payload.get("deductions")).doubleValue() : 0.0);

        double net = record.getBasicSalary() + record.getHousingAllowance() + record.getTransportAllowance()
                + record.getOtherAllowances() - record.getDeductions();
        record.setNetSalary(net);

        record.setMonth(payload.get("month") != null ? payload.get("month").toString() : "");
        record.setYear(payload.get("year") != null ? ((Number) payload.get("year")).intValue()
                : java.time.Year.now().getValue());
        record.setStatus((String) payload.get("status"));

        return payrollRepository.save(record);
    }

    public PayrollRecord updateStatus(Long id, String status) {
        PayrollRecord record = payrollRepository.findById(id).orElseThrow();
        record.setStatus(status);
        return payrollRepository.save(record);
    }
}
