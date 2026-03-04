package com.ghaith.erp.service;

import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final HrBranchRepository hrBranchRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final String CHAR_LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String CHAR_UPPER = CHAR_LOWER.toUpperCase();
    private static final String NUMBER = "0123456789";
    private static final String OTHER_CHAR = "!@#$%&*";
    private static final String PASSWORD_ALLOW_BASE = CHAR_LOWER + CHAR_UPPER + NUMBER + OTHER_CHAR;
    private static final SecureRandom random = new SecureRandom();

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

        // Auto-create User if email is provided
        if (employee.getEmail() != null && !employee.getEmail().isEmpty()) {
            String verificationCode = String.valueOf(100000 + random.nextInt(900000));
            Role role = Role.USER;
            try {
                if (employee.getRole() != null) {
                    role = Role.valueOf(employee.getRole().toUpperCase());
                }
            } catch (IllegalArgumentException e) {
                // Fallback to USER
            }

            User user = User.builder()
                    .username(employee.getEmail())
                    .email(employee.getEmail())
                    .password(passwordEncoder.encode(generateRandomPassword(10))) // Temporary until verified
                    .role(role)
                    .enabled(false)
                    .verificationCode(verificationCode)
                    .build();

            userRepository.save(user);
            employee.setUser(user);

            // Send verification code instead of credentials
            emailService.sendVerificationCode(employee.getEmail(), employee.getFirstName(), verificationCode);
        }

        return employeeRepository.save(employee);
    }

    public java.util.Map<String, String> createSimpleEmployee(String firstName, String lastName, String email,
            String phone, Long branchId, String roleStr) {
        System.out.println("Starting createSimpleEmployee for email: " + email);

        // Validate: check if this email is already used by an existing employee
        if (email != null && employeeRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("An employee with email '" + email + "' already exists.");
        }

        Employee employee = new Employee();
        employee.setFirstName(firstName);
        employee.setLastName(lastName);
        employee.setEmail(email);
        employee.setPhone(phone);
        employee.setEmployeeNumber("EMP" + System.currentTimeMillis());
        employee.setStatus(Employee.EmployeeStatus.inactive);

        if (branchId != null) {
            employee.setBranch(hrBranchRepository.findById(branchId).orElse(null));
        }

        // Create User Account
        String verificationCode = String.valueOf(100000 + random.nextInt(900000));
        System.out.println("Generated verification code: " + verificationCode);
        Role role = Role.USER;
        try {
            if (roleStr != null) {
                role = Role.valueOf(roleStr.toUpperCase());
            }
        } catch (IllegalArgumentException e) {
            System.out.println("Invalid role: " + roleStr + ", fallback to USER");
        }

        System.out.println("Creating User object for role: " + role);
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            // User exists — check if already linked to another employee
            if (employeeRepository.findByUserId(user.getId()).isPresent()) {
                throw new RuntimeException(
                        "A user with email '" + email + "' is already linked to an existing employee.");
            }
            // Update for verification
            System.out.println("Updating existing user ID: " + user.getId() + " with verification code.");
            user.setEnabled(false);
            user.setVerificationCode(verificationCode);
            userRepository.save(user);
        } else {
            System.out.println("Creating new User...");
            user = User.builder()
                    .username(email)
                    .email(email)
                    .password(passwordEncoder.encode(generateRandomPassword(10)))
                    .role(role)
                    .enabled(false)
                    .verificationCode(verificationCode)
                    .build();
            userRepository.save(user);
            System.out.println("New User saved. ID: " + user.getId());
        }

        employee.setUser(user);
        System.out.println("Saving Employee...");
        employeeRepository.save(employee);
        System.out.println("Employee saved. ID: " + employee.getId());

        // Send verification code
        System.out.println("Triggering verification code email...");
        emailService.sendVerificationCode(email, firstName, verificationCode);
        System.out.println("Verification email trigger completed.");

        java.util.Map<String, String> result = new java.util.HashMap<>();
        result.put("employeeNumber", employee.getEmployeeNumber());
        result.put("verificationCode", verificationCode);
        result.put("requestNumber", "REQ" + (int) (Math.random() * 100000));
        return result;
    }

    private String generateRandomPassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int rndCharAt = random.nextInt(PASSWORD_ALLOW_BASE.length());
            char rndChar = PASSWORD_ALLOW_BASE.charAt(rndCharAt);
            sb.append(rndChar);
        }
        return sb.toString();
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
