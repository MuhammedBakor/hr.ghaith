package com.ghaith.erp.service;

import com.ghaith.erp.exception.DuplicateEmailException;

import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
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
    private final EntityManager entityManager;
    private final ShiftRepository shiftRepository;

    private static final String CHAR_LOWER = "abcdefghijklmnopqrstuvwxyz";
    private static final String CHAR_UPPER = CHAR_LOWER.toUpperCase();
    private static final String NUMBER = "0123456789";
    private static final String OTHER_CHAR = "!@#$%&*";
    private static final String PASSWORD_ALLOW_BASE = CHAR_LOWER + CHAR_UPPER + NUMBER + OTHER_CHAR;
    private static final SecureRandom random = new SecureRandom();

    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    public List<Employee> getAllEmployeesByBranch(Long branchId) {
        return employeeRepository.findByBranch_Id(branchId);
    }

    public List<Employee> getAllEmployeesByBranchAndDepartment(Long branchId, Long departmentId) {
        return employeeRepository.findByBranch_IdAndDepartment_Id(branchId, departmentId);
    }

    public List<Employee> getAllEmployeesByDepartment(Long departmentId) {
        return employeeRepository.findByDepartmentId(departmentId);
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
            String email = employee.getEmail();
            Long branchId = employee.getBranch() != null ? employee.getBranch().getId() : null;

            // Duplicate check
            if (branchId != null) {
                // Branch-scoped check
                if (employeeRepository.findByEmailIgnoreCaseAndBranch_Id(email, branchId).isPresent()) {
                    throw new DuplicateEmailException(
                            "البريد الإلكتروني '" + email + "' مسجل لموظف آخر في نفس الفرع بالفعل.");
                }
            } else {
                // Global fallback check (manual add without branch context)
                if (employeeRepository.findByEmailIgnoreCase(email).isPresent()) {
                    throw new DuplicateEmailException("البريد الإلكتروني '" + email + "' مسجل لموظف آخر بالفعل.");
                }
            }

            String verificationCode = String.valueOf(100000 + random.nextInt(900000));
            Role role = Role.EMPLOYEE;
            String customRoleCode = null;
            try {
                if (employee.getRole() != null) {
                    role = Role.valueOf(employee.getRole().toUpperCase());
                }
            } catch (IllegalArgumentException e) {
                // Not an enum role — treat as a custom RolePack code
                customRoleCode = employee.getRole();
            }

            // Reuse existing user account if email already exists (user may be employee in
            // another branch)
            User existingUser = userRepository.findByEmail(email).orElse(null);
            if (existingUser != null) {
                existingUser.setVerificationCode(verificationCode);
                if (customRoleCode != null) existingUser.setRoles(customRoleCode);
                userRepository.save(existingUser);
                employee.setUser(existingUser);
            } else {
                User user = User.builder()
                        .username(email)
                        .email(email)
                        .password(passwordEncoder.encode(generateRandomPassword(10)))
                        .role(role)
                        .roles(customRoleCode) // store custom RolePack code here
                        .enabled(false)
                        .verificationCode(verificationCode)
                        .build();
                userRepository.save(user);
                employee.setUser(user);
            }

            // Send verification code
            emailService.sendVerificationCode(email, employee.getFirstName(), verificationCode,
                    employee.getEmployeeNumber());
        }

        return employeeRepository.save(employee);
    }

    public java.util.Map<String, String> createSimpleEmployee(String firstName, String lastName, String email,
            String phone, Long branchId, Long departmentId, Long positionId, String roleStr, Long managerId,
            java.math.BigDecimal salary, java.math.BigDecimal housingAllowance, java.math.BigDecimal transportAllowance,
            Long shiftId) {
        System.out.println("Starting createSimpleEmployee for email: " + email);

        // Validate: check if this email is already used by an employee IN THE SAME
        // BRANCH
        if (email != null) {
            if (branchId != null) {
                // Branch-scoped check: only reject if same email exists in the same branch
                if (employeeRepository.findByEmailIgnoreCaseAndBranch_Id(email, branchId).isPresent()) {
                    throw new DuplicateEmailException(
                            "البريد الإلكتروني '" + email + "' مسجل لموظف آخر في نفس الفرع بالفعل.");
                }
            } else {
                // No branch context: global check (legacy behavior)
                if (employeeRepository.findByEmailIgnoreCase(email).isPresent()) {
                    throw new DuplicateEmailException("البريد الإلكتروني '" + email + "' مسجل لموظف آخر بالفعل.");
                }
            }
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
        if (salary != null) {
            employee.setSalary(salary);
        }
        if (housingAllowance != null) {
            employee.setHousingAllowance(housingAllowance);
        }
        if (transportAllowance != null) {
            employee.setTransportAllowance(transportAllowance);
        }
        if (shiftId != null) {
            employee.setShift(shiftRepository.findById(shiftId).orElse(null));
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
            // User exists — check if already linked to an employee IN THE SAME BRANCH
            boolean alreadyEmployeeInBranch = branchId != null
                    ? employeeRepository.findByUser_IdAndBranch_Id(user.getId(), branchId).isPresent()
                    : !employeeRepository.findAllByUserId(user.getId()).isEmpty();
            if (alreadyEmployeeInBranch) {
                throw new DuplicateEmailException(
                        "البريد الإلكتروني '" + email + "' مرتبط بموظف موجود بالفعل في هذا الفرع.");
            }
            // User exists in another branch — reuse the same user account
            System.out
                    .println("Reusing existing user ID: " + user.getId() + " for new employee in branch: " + branchId);
            user.setVerificationCode(verificationCode);
            userRepository.save(user);
            // Evict cache to ensure Spring Security picks up the new verification code
            com.ghaith.erp.config.ApplicationConfig.evictUserCache(email);
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
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("الموظف غير موجود"));
        User user = employee.getUser();
        if (user == null) {
            throw new RuntimeException("لا يوجد حساب مستخدم مرتبط بهذا الموظف");
        }

        // Regenerate a fresh verification code each time invite is resent
        String verificationCode = String.valueOf(100000 + new java.util.Random().nextInt(900000));
        user.setVerificationCode(verificationCode);
        userRepository.save(user);

        if ("email".equals(method) || "both".equals(method)) {
            emailService.sendVerificationCode(
                    employee.getEmail(),
                    employee.getFirstName(),
                    verificationCode,
                    employee.getEmployeeNumber());
        }
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
        if (employeeDetails.getHousingAllowance() != null) {
            employee.setHousingAllowance(employeeDetails.getHousingAllowance());
        }
        if (employeeDetails.getTransportAllowance() != null) {
            employee.setTransportAllowance(employeeDetails.getTransportAllowance());
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

        // Manager update
        if (employeeDetails.getManager() != null && employeeDetails.getManager().getId() != null) {
            employee.setManager(employeeRepository.findById(employeeDetails.getManager().getId()).orElse(null));
        }

        // Shift update
        if (employeeDetails.getShift() != null && employeeDetails.getShift().getId() != null) {
            employee.setShift(shiftRepository.findById(employeeDetails.getShift().getId()).orElse(null));
        }

        // Role update (primary role + additional roles)
        if (employeeDetails.getRole() != null && !employeeDetails.getRole().isBlank() && employee.getUser() != null) {
            String roleStr = employeeDetails.getRole();
            // Could be comma-separated list: "DEPARTEMENT_MANAGER,SUPERVISOR"
            String[] roleParts = roleStr.split(",");
            // First role = primary
            try {
                Role primaryRole = Role.valueOf(roleParts[0].trim().toUpperCase());
                employee.getUser().setRole(primaryRole);
            } catch (IllegalArgumentException e) {
                System.out.println("Invalid primary role: " + roleParts[0]);
            }
            // Additional roles
            if (roleParts.length > 1) {
                StringBuilder additionalRoles = new StringBuilder();
                for (int i = 1; i < roleParts.length; i++) {
                    String r = roleParts[i].trim().toUpperCase();
                    try {
                        Role.valueOf(r); // validate
                        if (additionalRoles.length() > 0)
                            additionalRoles.append(",");
                        additionalRoles.append(r);
                    } catch (IllegalArgumentException e) {
                        System.out.println("Invalid additional role: " + r);
                    }
                }
                employee.getUser().setRoles(additionalRoles.length() > 0 ? additionalRoles.toString() : null);
            } else {
                employee.getUser().setRoles(null);
            }
            userRepository.save(employee.getUser());
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

        // Only allow updating self-service fields (NOT salary, department, position,
        // branch, role, manager)
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

    @Transactional
    public void deleteEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("الموظف غير موجود"));

        Long userId = employee.getUser() != null ? employee.getUser().getId() : null;

        // 1. Unlink manager/reviewer/author roles to avoid blocking deletion
        // Employees table (subordinates)
        entityManager.createNativeQuery("UPDATE employees SET manager_id = NULL WHERE manager_id = :id")
                .setParameter("id", id).executeUpdate();

        // Departments table (department manager)
        entityManager.createNativeQuery("UPDATE departments SET manager_id = NULL WHERE manager_id = :id")
                .setParameter("id", id).executeUpdate();

        // Performance reviews (reviewer role)
        entityManager.createNativeQuery("UPDATE performance_reviews SET reviewer_id = NULL WHERE reviewer_id = :id")
                .setParameter("id", id).executeUpdate();

        // Tickets (author and assigned agent)
        entityManager.createNativeQuery("UPDATE tickets SET author_id = NULL WHERE author_id = :id")
                .setParameter("id", id).executeUpdate();
        entityManager.createNativeQuery("UPDATE tickets SET assigned_to_id = NULL WHERE assigned_to_id = :id")
                .setParameter("id", id).executeUpdate();

        // Ticket comments (comment author)
        entityManager.createNativeQuery("UPDATE ticket_comments SET author_id = NULL WHERE author_id = :id")
                .setParameter("id", id).executeUpdate();

        // 2. Manual cascade cleanup for Field Tracking (Point -> Session)
        // Native SQL doesn't trigger JPA CascadeType.ALL
        entityManager.createNativeQuery(
                "DELETE FROM hr_field_tracking_points WHERE session_id IN (SELECT id FROM hr_field_tracking_sessions WHERE employee_id = :id)")
                .setParameter("id", id).executeUpdate();

        // 3. Clean up all primary dependent records
        String[][] tableInfos = {
                { "attendance_records", "employee_id" },
                { "payroll_records", "employee_id" },
                { "performance_reviews", "employee_id" },
                { "performance_kpis", "employee_id" },
                { "performance_goals", "employee_id" },
                { "hr_leave_requests", "employee_id" },
                { "hr_leave_balances", "employee_id" },
                { "training_enrollments", "employee_id" },
                { "hr_field_tracking_sessions", "employee_id" },
                { "employee_documents", "employee_id" },
                { "expenses", "employee_id" }
        };

        for (String[] info : tableInfos) {
            String tableName = info[0];
            String columnName = info[1];
            try {
                entityManager.createNativeQuery("DELETE FROM " + tableName + " WHERE " + columnName + " = :id")
                        .setParameter("id", id).executeUpdate();
            } catch (Exception e) {
                System.out.println("Could not clean up table " + tableName + ": " + e.getMessage());
            }
        }

        // 4. Delete the employee record itself
        entityManager.createNativeQuery("DELETE FROM employees WHERE id = :id")
                .setParameter("id", id).executeUpdate();

        // 5. Handle shared user account
        if (userId != null) {
            Number count = (Number) entityManager
                    .createNativeQuery("SELECT COUNT(*) FROM employees WHERE user_id = :uid")
                    .setParameter("uid", userId)
                    .getSingleResult();

            if (count.longValue() == 0) {
                System.out.println("No more employees for user ID " + userId + ". Deleting user account.");
                entityManager.createNativeQuery("DELETE FROM _users WHERE id = :uid")
                        .setParameter("uid", userId).executeUpdate();
            } else {
                System.out.println(
                        "User ID " + userId + " still has " + count + " other employee records. Keeping user account.");
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
        return employeeRepository.findAllByUserId(userId).stream().findFirst();
    }

    public Optional<Employee> getEmployeeByUserIdAndBranch(Long userId, Long branchId) {
        if (branchId != null) {
            return employeeRepository.findByUser_IdAndBranch_Id(userId, branchId);
        }
        return employeeRepository.findAllByUserId(userId).stream().findFirst();
    }

    public List<Employee> getSubordinates(Long managerId) {
        return employeeRepository.findByManagerId(managerId);
    }
}
