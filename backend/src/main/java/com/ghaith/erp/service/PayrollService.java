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

    public PayrollRecord createPayroll(Map<String, Object> payload) {
        Long employeeId = Long.valueOf(payload.get("employeeId").toString());
        Employee employee = employeeRepository.findById(employeeId).orElseThrow();

        PayrollRecord record = new PayrollRecord();
        record.setEmployee(employee);
        record.setBasicSalary(Double.valueOf(payload.get("basicSalary").toString()));
        record.setHousingAllowance(Double.valueOf(payload.get("housingAllowance").toString()));
        record.setTransportAllowance(Double.valueOf(payload.get("transportAllowance").toString()));
        record.setOtherAllowances(Double.valueOf(payload.get("otherAllowances").toString()));
        record.setDeductions(Double.valueOf(payload.get("deductions").toString()));

        double net = record.getBasicSalary() + record.getHousingAllowance() + record.getTransportAllowance()
                + record.getOtherAllowances() - record.getDeductions();
        record.setNetSalary(net);

        record.setMonth(payload.get("month").toString());
        record.setYear(Integer.valueOf(payload.get("year").toString()));
        record.setStatus((String) payload.get("status"));

        return payrollRepository.save(record);
    }

    public PayrollRecord updateStatus(Long id, String status) {
        PayrollRecord record = payrollRepository.findById(id).orElseThrow();
        record.setStatus(status);
        return payrollRepository.save(record);
    }
}
