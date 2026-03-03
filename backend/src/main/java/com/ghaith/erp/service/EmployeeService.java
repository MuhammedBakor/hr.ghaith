package com.ghaith.erp.service;

import com.ghaith.erp.model.Employee;
import com.ghaith.erp.repository.EmployeeRepository;
import com.ghaith.erp.repository.DepartmentRepository;
import com.ghaith.erp.repository.PositionRepository;
import com.ghaith.erp.repository.HrBranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final HrBranchRepository hrBranchRepository;

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public Optional<Employee> getEmployeeById(Long id) {
        return employeeRepository.findById(id);
    }

    public Optional<Employee> getEmployeeByNumber(String employeeNumber) {
        return employeeRepository.findByEmployeeNumber(employeeNumber);
    }

    public Employee createEmployee(Employee employee) {
        if (employee.getEmployeeNumber() == null) {
            employee.setEmployeeNumber("EMP" + System.currentTimeMillis());
        }
        return employeeRepository.save(employee);
    }

    public java.util.Map<String, String> createSimpleEmployee(String firstName, String lastName, String email,
            String phone, Long branchId) {
        Employee employee = new Employee();
        employee.setFirstName(firstName);
        employee.setLastName(lastName);
        employee.setEmail(email);
        employee.setPhone(phone);
        employee.setEmployeeNumber("EMP" + (int) (Math.random() * 100000));
        employee.setStatus(Employee.EmployeeStatus.inactive);

        if (branchId != null) {
            employee.setBranch(hrBranchRepository.findById(branchId).orElse(null));
        }

        employeeRepository.save(employee);

        java.util.Map<String, String> result = new java.util.HashMap<>();
        result.put("employeeNumber", employee.getEmployeeNumber());
        result.put("activationCode", "ACT" + (int) (Math.random() * 10000));
        result.put("requestNumber", "REQ" + (int) (Math.random() * 100000));
        return result;
    }

    public void inviteEmployee(Long id, String method) {
        // Implement invitation logic (email/sms)
        System.out.println("Inviting employee " + id + " via " + method);
    }

    public Employee updateEmployee(Long id, Employee employeeDetails) {
        Employee employee = employeeRepository.findById(id).orElse(null);
        if (employee != null) {
            employee.setFirstName(employeeDetails.getFirstName());
            employee.setLastName(employeeDetails.getLastName());
            employee.setEmail(employeeDetails.getEmail());
            employee.setPhone(employeeDetails.getPhone());
            employee.setSalary(employeeDetails.getSalary());
            employee.setStatus(employeeDetails.getStatus());

            if (employeeDetails.getDepartment() != null && employeeDetails.getDepartment().getId() != null) {
                employee.setDepartment(
                        departmentRepository.findById(employeeDetails.getDepartment().getId()).orElse(null));
            }
            if (employeeDetails.getPosition() != null && employeeDetails.getPosition().getId() != null) {
                employee.setPosition(positionRepository.findById(employeeDetails.getPosition().getId()).orElse(null));
            }

            return employeeRepository.save(employee);
        }
        return null;
    }

    public void deleteEmployee(Long id) {
        employeeRepository.deleteById(id);
    }

    public Optional<Employee> getEmployeeByUserId(Long userId) {
        return employeeRepository.findByUserId(userId);
    }

    public List<Employee> getSubordinates(Long managerId) {
        return employeeRepository.findByManagerId(managerId);
    }
}
