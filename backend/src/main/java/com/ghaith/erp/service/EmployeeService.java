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
            Role role = Role.EMPLOYEE;
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
            emailService.sendVerificationCode(employee.getEmail(), employee.getFirstName(), verificationCode, employee.getEmployeeNumber());
        }

        return employeeRepository.save(employee);
    }

    public java.util.Map<String, String> createSimpleEmployee(String firstName, String lastName, String email,
            String phone, Long branchId, Long departmentId, Long positionId, String roleStr, Long managerId) {
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
        if (departmentId != null) {
            employee.setDepartment(departmentRepository.findById(departmentId).orElse(null));
        }
        if (positionId != null) {
            employee.setPosition(positionRepository.findById(positionId).orElse(null));
        }
        if (managerId != null) {
            employee.setManager(employeeRepository.findById(managerId).orElse(null));
        }

        // Create User Account
        String verificationCode = String.valueOf(100000 + random.nextInt(900000));
        System.out.println("Generated verification code: " + verificationCode);
        Role role = Role.EMPLOYEE;
        try {
            if (roleStr != null) {
                role = Role.valueOf(roleStr.toUpperCase());
            }
        } catch (IllegalArgumentException e) {
            System.out.println("Invalid role: " + roleStr + ", fallback to EMPLOYEE");
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
        emailService.sendVerificationCode(email, firstName, verificationCode, employee.getEmployeeNumber());
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
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));

        // Partial update: only update non-null fields
        if (employeeDetails.getFirstName() != null) {
            employee.setFirstName(employeeDetails.getFirstName());
        }
        if (employeeDetails.getLastName() != null) {
            employee.setLastName(employeeDetails.getLastName());
        }
        if (employeeDetails.getEmail() != null) {
            employee.setEmail(employeeDetails.getEmail());
        }
        if (employeeDetails.getPhone() != null) {
            employee.setPhone(employeeDetails.getPhone());
        }
        if (employeeDetails.getSalary() != null) {
            employee.setSalary(employeeDetails.getSalary());
        }
        if (employeeDetails.getStatus() != null) {
            employee.setStatus(employeeDetails.getStatus());
            // Disable user account when suspended or terminated
            if (employee.getUser() != null &&
                (employeeDetails.getStatus() == Employee.EmployeeStatus.suspended ||
                 employeeDetails.getStatus() == Employee.EmployeeStatus.terminated)) {
                employee.getUser().setEnabled(false);
                userRepository.save(employee.getUser());
            }
            // Re-enable user account when reactivated
            if (employee.getUser() != null &&
                employeeDetails.getStatus() == Employee.EmployeeStatus.active) {
                employee.getUser().setEnabled(true);
                userRepository.save(employee.getUser());
            }
        }

        if (employeeDetails.getDepartment() != null && employeeDetails.getDepartment().getId() != null) {
            employee.setDepartment(
                    departmentRepository.findById(employeeDetails.getDepartment().getId()).orElse(null));
        }
        if (employeeDetails.getPosition() != null && employeeDetails.getPosition().getId() != null) {
            employee.setPosition(positionRepository.findById(employeeDetails.getPosition().getId()).orElse(null));
        }
        if (employeeDetails.getBranch() != null && employeeDetails.getBranch().getId() != null) {
            employee.setBranch(hrBranchRepository.findById(employeeDetails.getBranch().getId()).orElse(null));
        }

        // Additional personal info fields
        if (employeeDetails.getNationalId() != null) {
            employee.setNationalId(employeeDetails.getNationalId());
        }
        if (employeeDetails.getNationality() != null) {
            employee.setNationality(employeeDetails.getNationality());
        }
        if (employeeDetails.getDateOfBirth() != null) {
            employee.setDateOfBirth(employeeDetails.getDateOfBirth());
        }
        if (employeeDetails.getGender() != null) {
            employee.setGender(employeeDetails.getGender());
        }
        if (employeeDetails.getMaritalStatus() != null) {
            employee.setMaritalStatus(employeeDetails.getMaritalStatus());
        }
        if (employeeDetails.getAddress() != null) {
            employee.setAddress(employeeDetails.getAddress());
        }
        if (employeeDetails.getCity() != null) {
            employee.setCity(employeeDetails.getCity());
        }

        // Emergency contact fields
        if (employeeDetails.getEmergencyName() != null) {
            employee.setEmergencyName(employeeDetails.getEmergencyName());
        }
        if (employeeDetails.getEmergencyRelation() != null) {
            employee.setEmergencyRelation(employeeDetails.getEmergencyRelation());
        }
        if (employeeDetails.getEmergencyPhone() != null) {
            employee.setEmergencyPhone(employeeDetails.getEmergencyPhone());
        }

        // Bank info fields
        if (employeeDetails.getBankName() != null) {
            employee.setBankName(employeeDetails.getBankName());
        }
        if (employeeDetails.getBankAccount() != null) {
            employee.setBankAccount(employeeDetails.getBankAccount());
        }
        if (employeeDetails.getIban() != null) {
            employee.setIban(employeeDetails.getIban());
        }

        return employeeRepository.save(employee);
    }

    public Employee updateEmployeeSelfService(Long employeeId, java.util.Map<String, Object> profileData) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("الموظف غير موجود"));

        // Only allow updating self-service fields (NOT salary, department, position, branch, role, manager)
        if (profileData.containsKey("nationalId")) {
            employee.setNationalId((String) profileData.get("nationalId"));
        }
        if (profileData.containsKey("nationality")) {
            employee.setNationality((String) profileData.get("nationality"));
        }
        if (profileData.containsKey("dateOfBirth")) {
            employee.setDateOfBirth((String) profileData.get("dateOfBirth"));
        }
        if (profileData.containsKey("gender")) {
            employee.setGender((String) profileData.get("gender"));
        }
        if (profileData.containsKey("maritalStatus")) {
            employee.setMaritalStatus((String) profileData.get("maritalStatus"));
        }
        if (profileData.containsKey("address")) {
            employee.setAddress((String) profileData.get("address"));
        }
        if (profileData.containsKey("city")) {
            employee.setCity((String) profileData.get("city"));
        }
        if (profileData.containsKey("phone")) {
            employee.setPhone((String) profileData.get("phone"));
        }

        // Emergency Contact
        if (profileData.containsKey("emergencyName")) {
            employee.setEmergencyName((String) profileData.get("emergencyName"));
        }
        if (profileData.containsKey("emergencyRelation")) {
            employee.setEmergencyRelation((String) profileData.get("emergencyRelation"));
        }
        if (profileData.containsKey("emergencyPhone")) {
            employee.setEmergencyPhone((String) profileData.get("emergencyPhone"));
        }

        // Bank Info
        if (profileData.containsKey("bankName")) {
            employee.setBankName((String) profileData.get("bankName"));
        }
        if (profileData.containsKey("bankAccount")) {
            employee.setBankAccount((String) profileData.get("bankAccount"));
        }
        if (profileData.containsKey("iban")) {
            employee.setIban((String) profileData.get("iban"));
        }

        // Keep status as incomplete - admin needs to review and add salary
        return employeeRepository.save(employee);
    }

    public void deleteEmployee(Long id) {
        Employee employee = employeeRepository.findById(id).orElse(null);
        if (employee != null) {
            User user = employee.getUser();
            employeeRepository.delete(employee);
            if (user != null) {
                userRepository.delete(user);
            }
        }
    }

    public Employee changeEmployeeStatus(Long id, String statusStr) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));

        Employee.EmployeeStatus newStatus = Employee.EmployeeStatus.valueOf(statusStr);
        employee.setStatus(newStatus);

        // Disable user account when suspended or terminated
        if (employee.getUser() != null &&
            (newStatus == Employee.EmployeeStatus.suspended ||
             newStatus == Employee.EmployeeStatus.terminated)) {
            employee.getUser().setEnabled(false);
            userRepository.save(employee.getUser());
        }
        // Re-enable user account when reactivated
        if (employee.getUser() != null && newStatus == Employee.EmployeeStatus.active) {
            employee.getUser().setEnabled(true);
            userRepository.save(employee.getUser());
        }

        return employeeRepository.save(employee);
    }

    public Optional<Employee> getEmployeeByUserId(Long userId) {
        return employeeRepository.findByUserId(userId);
    }

    public List<Employee> getSubordinates(Long managerId) {
        return employeeRepository.findByManagerId(managerId);
    }
}
