package com.ghaith.erp.service;

import com.ghaith.erp.exception.DuplicateEmailException;
import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
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
    private final LeaveBalanceService leaveBalanceService;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final OnboardingTaskRepository onboardingTaskRepository;

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
        // --- Validations ---
        validateNewEmployee(employee);

        // Generate proper employee number
        if (employee.getEmployeeNumber() == null || employee.getEmployeeNumber().startsWith("EMP1")) {
            employee.setEmployeeNumber(generateEmployeeNumber());
        }

        // Set probation end date
        if (employee.getHireDate() != null) {
            try {
                LocalDate hire = LocalDate.parse(employee.getHireDate());
                employee.setProbationEndDate(hire.plusDays(90).toString());
            } catch (Exception e) {
                log.warn("Could not parse hireDate: {}", employee.getHireDate());
            }
        }

        // Auto-create User if email is provided
        if (employee.getEmail() != null && !employee.getEmail().isEmpty()) {
            String email = employee.getEmail();
            Long branchId = employee.getBranch() != null ? employee.getBranch().getId() : null;

            if (branchId != null) {
                if (employeeRepository.findByEmailIgnoreCaseAndBranch_Id(email, branchId).isPresent()) {
                    throw new DuplicateEmailException(
                            "البريد الإلكتروني '" + email + "' مسجل لموظف آخر في نفس الفرع بالفعل.");
                }
            } else {
                if (employeeRepository.findByEmailIgnoreCase(email).isPresent()) {
                    throw new DuplicateEmailException("البريد الإلكتروني '" + email + "' مسجل لموظف آخر بالفعل.");
                }
            }

            String verificationCode = String.valueOf(100000 + random.nextInt(900000));
            User existingUser = userRepository.findByEmail(email).orElse(null);

            Role primaryRole = Role.EMPLOYEE;
            String additionalRoles = null;
            if (employee.getRole() != null) {
                String[] parts = employee.getRole().split(",");
                try {
                    primaryRole = Role.valueOf(parts[0].trim().toUpperCase());
                } catch (IllegalArgumentException e) {
                    additionalRoles = parts[0].trim();
                }
                if (parts.length > 1) {
                    StringBuilder sb = new StringBuilder();
                    for (int i = 1; i < parts.length; i++) {
                        if (sb.length() > 0) sb.append(",");
                        sb.append(parts[i].trim().toUpperCase());
                    }
                    if (additionalRoles == null) additionalRoles = sb.toString();
                    else additionalRoles += "," + sb.toString();
                }
            }

            if (existingUser != null) {
                existingUser.setVerificationCode(verificationCode);
                existingUser.setRole(primaryRole);
                if (additionalRoles != null) existingUser.setRoles(additionalRoles);
                userRepository.save(existingUser);
                employee.setUser(existingUser);
            } else {
                User user = User.builder()
                        .username(email)
                        .email(email)
                        .password(passwordEncoder.encode(generateRandomPassword(10)))
                        .role(primaryRole)
                        .roles(additionalRoles)
                        .enabled(false)
                        .verificationCode(verificationCode)
                        .build();
                userRepository.save(user);
                employee.setUser(user);
            }

            emailService.sendVerificationCode(email, employee.getFirstName(), verificationCode,
                    employee.getEmployeeNumber());
        }

        Employee saved = employeeRepository.save(employee);

        // --- Post-save automated operations ---
        runPostSaveOperations(saved);

        return saved;
    }

    private void validateNewEmployee(Employee employee) {
        // Duplicate national ID check
        if (employee.getNationalId() != null && !employee.getNationalId().isBlank()) {
            boolean dupNationalId = employeeRepository.findAll().stream()
                    .anyMatch(e -> employee.getNationalId().equals(e.getNationalId()));
            if (dupNationalId) {
                throw new RuntimeException("DUPLICATE_NATIONAL_ID:رقم الهوية الوطنية '" + employee.getNationalId() + "' مسجل لموظف آخر بالفعل.");
            }
        }

        // Age >= 18
        if (employee.getDateOfBirth() != null && !employee.getDateOfBirth().isBlank()) {
            try {
                LocalDate dob = LocalDate.parse(employee.getDateOfBirth());
                if (dob.plusYears(18).isAfter(LocalDate.now())) {
                    throw new RuntimeException("AGE_RESTRICTION:عمر الموظف يجب أن لا يقل عن 18 سنة.");
                }
            } catch (RuntimeException e) {
                if (e.getMessage() != null && e.getMessage().startsWith("AGE_RESTRICTION")) throw e;
                log.warn("Could not parse dateOfBirth for age validation: {}", employee.getDateOfBirth());
            }
        }

        // Hire date not in the past (only warn if hireDate is provided)
        if (employee.getHireDate() != null && !employee.getHireDate().isBlank()) {
            try {
                LocalDate hireDate = LocalDate.parse(employee.getHireDate());
                if (hireDate.isBefore(LocalDate.now().minusDays(1))) {
                    throw new RuntimeException("HIRE_DATE_PAST:تاريخ التعيين لا يمكن أن يكون في الماضي.");
                }
            } catch (RuntimeException e) {
                if (e.getMessage() != null && e.getMessage().startsWith("HIRE_DATE_PAST")) throw e;
                log.warn("Could not parse hireDate for validation: {}", employee.getHireDate());
            }
        }

        // Manager cannot be self (will be same id only after save, so check by email/name)
        // This is enforced in the controller by comparing managerId != employeeId

        // IBAN format: must start with SA and be 24 chars
        if (employee.getIban() != null && !employee.getIban().isBlank()) {
            String iban = employee.getIban().trim().toUpperCase();
            if (!iban.matches("^SA\\d{22}$")) {
                throw new RuntimeException("IBAN_INVALID:رقم الآيبان يجب أن يبدأ بـ SA ويتكون من 24 حرفاً.");
            }
        }
    }

    private void runPostSaveOperations(Employee employee) {
        try {
            // 1. Create 10 leave balances
            String[] leaveTypes = {"annual", "sick", "emergency", "maternity", "paternity", "hajj", "marriage", "death", "exam", "unpaid"};
            int[] entitlements = {21, 30, 5, 70, 3, 15, 5, 5, 10, 0};
            for (int i = 0; i < leaveTypes.length; i++) {
                try {
                    leaveBalanceService.createBalance(employee.getId(), leaveTypes[i], entitlements[i]);
                } catch (Exception e) {
                    log.warn("Could not create leave balance for type {}: {}", leaveTypes[i], e.getMessage());
                }
            }

            // 2. Create 4 onboarding tasks
            String[][] tasks = {
                {"device_handover", "IT"},
                {"contract_sign", "HR"},
                {"team_intro", "MANAGER"},
                {"orientation", "TRAINING"}
            };
            LocalDate dueDate = LocalDate.now().plusDays(7);
            for (String[] task : tasks) {
                OnboardingTask onboardingTask = OnboardingTask.builder()
                        .employee(employee)
                        .taskType(task[0])
                        .assignedToRole(task[1])
                        .status("pending")
                        .dueDate(dueDate)
                        .build();
                onboardingTaskRepository.save(onboardingTask);
            }

            // 3. Notify direct manager
            if (employee.getManager() != null && employee.getManager().getUser() != null) {
                Long managerId = employee.getManager().getUser().getId();
                notificationService.createNotification(
                        managerId,
                        "موظف جديد في فريقك",
                        employee.getFirstName() + " " + employee.getLastName() + " انضم إلى فريقك ولديك 4 مهام onboarding",
                        "onboarding",
                        employee.getId(),
                        "employee"
                );
            }

            // 4. Notify HR -- find users with HR role
            userRepository.findAll().stream()
                    .filter(u -> u.getRoles() != null && (u.getRoles().contains("HR") || u.getRoles().contains("hr_manager")))
                    .forEach(hrUser -> notificationService.createNotification(
                            hrUser.getId(),
                            "موظف جديد للتوثيق",
                            "تم إضافة الموظف " + employee.getFirstName() + " " + employee.getLastName() +
                            " برقم " + employee.getEmployeeNumber(),
                            "onboarding",
                            employee.getId(),
                            "employee"
                    ));

            // 5. Audit log
            auditLogService.createLog(AuditLog.builder()
                    .module("HR")
                    .eventType("EMPLOYEE_CREATED")
                    .description("تم إنشاء موظف جديد: " + employee.getFirstName() + " " + employee.getLastName())
                    .severity("info")
                    .entityId(employee.getId())
                    .build());

            log.info("Post-save operations completed for employee ID: {}", employee.getId());
        } catch (Exception e) {
            log.error("Error in post-save operations for employee {}: {}", employee.getId(), e.getMessage(), e);
        }
    }

    private String generateEmployeeNumber() {
        int year = LocalDate.now().getYear();
        long count = employeeRepository.count() + 1;
        return String.format("EMP-%d-%03d", year, count);
    }

    public java.util.Map<String, String> createSimpleEmployee(String firstName, String lastName, String email,
            String phone, String jobTitle, Long branchId, Long departmentId, Long positionId, String roleStr, Long managerId,
            java.math.BigDecimal salary, java.math.BigDecimal housingAllowance, java.math.BigDecimal transportAllowance,
            Long shiftId) {

        if (email != null) {
            if (branchId != null) {
                if (employeeRepository.findByEmailIgnoreCaseAndBranch_Id(email, branchId).isPresent()) {
                    throw new DuplicateEmailException(
                            "البريد الإلكتروني '" + email + "' مسجل لموظف آخر في نفس الفرع بالفعل.");
                }
            } else {
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
        if (jobTitle != null) employee.setJobTitle(jobTitle);
        employee.setEmployeeNumber(generateEmployeeNumber());
        employee.setStatus(Employee.EmployeeStatus.inactive);
        employee.setHireDate(LocalDate.now().toString());
        employee.setProbationEndDate(LocalDate.now().plusDays(90).toString());

        if (branchId != null) employee.setBranch(hrBranchRepository.findById(branchId).orElse(null));
        if (departmentId != null) employee.setDepartment(departmentRepository.findById(departmentId).orElse(null));
        if (positionId != null) employee.setPosition(positionRepository.findById(positionId).orElse(null));
        if (managerId != null) employee.setManager(employeeRepository.findById(managerId).orElse(null));
        if (salary != null) employee.setSalary(salary);
        if (housingAllowance != null) employee.setHousingAllowance(housingAllowance);
        if (transportAllowance != null) employee.setTransportAllowance(transportAllowance);
        if (shiftId != null) employee.setShift(shiftRepository.findById(shiftId).orElse(null));

        String verificationCode = String.valueOf(100000 + random.nextInt(900000));
        Role primaryRole = Role.EMPLOYEE;
        String additionalRoles = null;
        if (roleStr != null) {
            String[] parts = roleStr.split(",");
            try { primaryRole = Role.valueOf(parts[0].trim().toUpperCase()); }
            catch (IllegalArgumentException e) { additionalRoles = parts[0].trim(); }
            if (parts.length > 1) {
                StringBuilder sb = new StringBuilder();
                for (int i = 1; i < parts.length; i++) {
                    if (sb.length() > 0) sb.append(",");
                    sb.append(parts[i].trim().toUpperCase());
                }
                if (additionalRoles == null) additionalRoles = sb.toString();
                else additionalRoles += "," + sb.toString();
            }
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            boolean alreadyEmployeeInBranch = branchId != null
                    ? employeeRepository.findByUser_IdAndBranch_Id(user.getId(), branchId).isPresent()
                    : !employeeRepository.findAllByUserId(user.getId()).isEmpty();
            if (alreadyEmployeeInBranch) {
                throw new DuplicateEmailException(
                        "البريد الإلكتروني '" + email + "' مرتبط بموظف موجود بالفعل في هذا الفرع.");
            }
            user.setVerificationCode(verificationCode);
            user.setRole(primaryRole);
            if (additionalRoles != null) user.setRoles(additionalRoles);
            userRepository.save(user);
            com.ghaith.erp.config.ApplicationConfig.evictUserCache(email);
        } else {
            user = User.builder()
                    .username(email)
                    .email(email)
                    .password(passwordEncoder.encode(generateRandomPassword(10)))
                    .role(primaryRole)
                    .roles(additionalRoles)
                    .enabled(false)
                    .verificationCode(verificationCode)
                    .build();
            userRepository.save(user);
        }

        employee.setUser(user);
        employeeRepository.save(employee);
        emailService.sendVerificationCode(email, firstName, verificationCode, employee.getEmployeeNumber());

        // Post-save operations
        runPostSaveOperations(employee);

        java.util.Map<String, String> result = new java.util.HashMap<>();
        result.put("employeeNumber", employee.getEmployeeNumber());
        result.put("verificationCode", verificationCode);
        result.put("requestNumber", "REQ" + (int) (Math.random() * 100000));
        return result;
    }

    private String generateRandomPassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(PASSWORD_ALLOW_BASE.charAt(random.nextInt(PASSWORD_ALLOW_BASE.length())));
        }
        return sb.toString();
    }

    public void inviteEmployee(Long id, String method) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("الموظف غير موجود"));
        User user = employee.getUser();
        if (user == null) throw new RuntimeException("لا يوجد حساب مستخدم مرتبط بهذا الموظف");

        String verificationCode = String.valueOf(100000 + new java.util.Random().nextInt(900000));
        user.setVerificationCode(verificationCode);
        userRepository.save(user);

        if ("email".equals(method) || "both".equals(method)) {
            emailService.sendVerificationCode(employee.getEmail(), employee.getFirstName(),
                    verificationCode, employee.getEmployeeNumber());
        }
    }

    public Employee updateEmployee(Long id, Employee employeeDetails) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));

        if (employeeDetails.getFirstName() != null) employee.setFirstName(employeeDetails.getFirstName());
        if (employeeDetails.getLastName() != null) employee.setLastName(employeeDetails.getLastName());
        if (employeeDetails.getEmail() != null) employee.setEmail(employeeDetails.getEmail());
        if (employeeDetails.getPhone() != null) employee.setPhone(employeeDetails.getPhone());
        if (employeeDetails.getJobTitle() != null) employee.setJobTitle(employeeDetails.getJobTitle());
        if (employeeDetails.getSalary() != null) employee.setSalary(employeeDetails.getSalary());
        if (employeeDetails.getHousingAllowance() != null) employee.setHousingAllowance(employeeDetails.getHousingAllowance());
        if (employeeDetails.getTransportAllowance() != null) employee.setTransportAllowance(employeeDetails.getTransportAllowance());
        if (employeeDetails.getHireDate() != null) employee.setHireDate(employeeDetails.getHireDate());

        if (employeeDetails.getStatus() != null) {
            employee.setStatus(employeeDetails.getStatus());
            if (employee.getUser() != null &&
                    (employeeDetails.getStatus() == Employee.EmployeeStatus.suspended ||
                            employeeDetails.getStatus() == Employee.EmployeeStatus.terminated)) {
                employee.getUser().setEnabled(false);
                userRepository.save(employee.getUser());
            }
            if (employee.getUser() != null && employeeDetails.getStatus() == Employee.EmployeeStatus.active) {
                employee.getUser().setEnabled(true);
                userRepository.save(employee.getUser());
            }
        }

        if (employeeDetails.getDepartment() != null && employeeDetails.getDepartment().getId() != null)
            employee.setDepartment(departmentRepository.findById(employeeDetails.getDepartment().getId()).orElse(null));
        if (employeeDetails.getPosition() != null && employeeDetails.getPosition().getId() != null)
            employee.setPosition(positionRepository.findById(employeeDetails.getPosition().getId()).orElse(null));
        if (employeeDetails.getBranch() != null && employeeDetails.getBranch().getId() != null)
            employee.setBranch(hrBranchRepository.findById(employeeDetails.getBranch().getId()).orElse(null));
        if (employeeDetails.getManager() != null && employeeDetails.getManager().getId() != null)
            employee.setManager(employeeRepository.findById(employeeDetails.getManager().getId()).orElse(null));
        if (employeeDetails.getShift() != null && employeeDetails.getShift().getId() != null)
            employee.setShift(shiftRepository.findById(employeeDetails.getShift().getId()).orElse(null));

        if (employeeDetails.getRole() != null && !employeeDetails.getRole().isBlank() && employee.getUser() != null) {
            String[] roleParts = employeeDetails.getRole().split(",");
            try { employee.getUser().setRole(Role.valueOf(roleParts[0].trim().toUpperCase())); }
            catch (IllegalArgumentException e) { log.warn("Invalid primary role: {}", roleParts[0]); }
            if (roleParts.length > 1) {
                StringBuilder additionalRoles = new StringBuilder();
                for (int i = 1; i < roleParts.length; i++) {
                    String r = roleParts[i].trim().toUpperCase();
                    try { Role.valueOf(r); if (additionalRoles.length() > 0) additionalRoles.append(","); additionalRoles.append(r); }
                    catch (IllegalArgumentException e) { log.warn("Invalid additional role: {}", r); }
                }
                employee.getUser().setRoles(additionalRoles.length() > 0 ? additionalRoles.toString() : null);
            } else { employee.getUser().setRoles(null); }
            userRepository.save(employee.getUser());
        }

        if (employeeDetails.getNationalId() != null) employee.setNationalId(employeeDetails.getNationalId());
        if (employeeDetails.getNationality() != null) employee.setNationality(employeeDetails.getNationality());
        if (employeeDetails.getDateOfBirth() != null) employee.setDateOfBirth(employeeDetails.getDateOfBirth());
        if (employeeDetails.getGender() != null) employee.setGender(employeeDetails.getGender());
        if (employeeDetails.getMaritalStatus() != null) employee.setMaritalStatus(employeeDetails.getMaritalStatus());
        if (employeeDetails.getAddress() != null) employee.setAddress(employeeDetails.getAddress());
        if (employeeDetails.getCity() != null) employee.setCity(employeeDetails.getCity());
        if (employeeDetails.getEmergencyName() != null) employee.setEmergencyName(employeeDetails.getEmergencyName());
        if (employeeDetails.getEmergencyRelation() != null) employee.setEmergencyRelation(employeeDetails.getEmergencyRelation());
        if (employeeDetails.getEmergencyPhone() != null) employee.setEmergencyPhone(employeeDetails.getEmergencyPhone());
        if (employeeDetails.getBankName() != null) employee.setBankName(employeeDetails.getBankName());
        if (employeeDetails.getBankAccount() != null) employee.setBankAccount(employeeDetails.getBankAccount());
        if (employeeDetails.getIban() != null) employee.setIban(employeeDetails.getIban());

        return employeeRepository.save(employee);
    }

    public Employee updateEmployeeSelfService(Long employeeId, java.util.Map<String, Object> profileData) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("الموظف غير موجود"));

        if (profileData.containsKey("nationalId")) employee.setNationalId((String) profileData.get("nationalId"));
        if (profileData.containsKey("nationality")) employee.setNationality((String) profileData.get("nationality"));
        if (profileData.containsKey("dateOfBirth")) employee.setDateOfBirth((String) profileData.get("dateOfBirth"));
        if (profileData.containsKey("gender")) employee.setGender((String) profileData.get("gender"));
        if (profileData.containsKey("maritalStatus")) employee.setMaritalStatus((String) profileData.get("maritalStatus"));
        if (profileData.containsKey("address")) employee.setAddress((String) profileData.get("address"));
        if (profileData.containsKey("city")) employee.setCity((String) profileData.get("city"));
        if (profileData.containsKey("phone")) employee.setPhone((String) profileData.get("phone"));
        if (profileData.containsKey("emergencyName")) employee.setEmergencyName((String) profileData.get("emergencyName"));
        if (profileData.containsKey("emergencyRelation")) employee.setEmergencyRelation((String) profileData.get("emergencyRelation"));
        if (profileData.containsKey("emergencyPhone")) employee.setEmergencyPhone((String) profileData.get("emergencyPhone"));
        if (profileData.containsKey("bankName")) employee.setBankName((String) profileData.get("bankName"));
        if (profileData.containsKey("bankAccount")) employee.setBankAccount((String) profileData.get("bankAccount"));
        if (profileData.containsKey("iban")) employee.setIban((String) profileData.get("iban"));

        return employeeRepository.save(employee);
    }

    @Transactional
    public void deleteEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("الموظف غير موجود"));
        Long userId = employee.getUser() != null ? employee.getUser().getId() : null;
        log.info("Starting deletion of employee ID: {}, User ID: {}", id, userId);
        entityManager.clear();
        cleanFkReferences("employees", "id", id);
        entityManager.createNativeQuery("UPDATE employees SET manager_id = NULL WHERE manager_id = :id")
                .setParameter("id", id).executeUpdate();
        entityManager.createNativeQuery("DELETE FROM employees WHERE id = :id")
                .setParameter("id", id).executeUpdate();
        if (userId != null) {
            Number count = (Number) entityManager
                    .createNativeQuery("SELECT COUNT(*) FROM employees WHERE user_id = :uid")
                    .setParameter("uid", userId).getSingleResult();
            if (count.longValue() == 0) {
                cleanFkReferences("_users", "id", userId);
                entityManager.createNativeQuery("DELETE FROM _users WHERE id = :uid")
                        .setParameter("uid", userId).executeUpdate();
            }
        }
        log.info("Successfully deleted employee ID: {}", id);
    }

    private void cleanFkReferences(String targetTable, String targetColumn, Long targetId) {
        @SuppressWarnings("unchecked")
        List<Object[]> fks = entityManager.createNativeQuery(
                "SELECT kcu.table_name, kcu.column_name, c.is_nullable " +
                        "FROM information_schema.key_column_usage kcu " +
                        "JOIN information_schema.referential_constraints rc ON kcu.constraint_name = rc.constraint_name " +
                        "JOIN information_schema.key_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name " +
                        "JOIN information_schema.columns c ON c.table_name = kcu.table_name " +
                        "  AND c.column_name = kcu.column_name AND c.table_schema = kcu.table_schema " +
                        "WHERE ccu.table_name = :targetTable AND ccu.column_name = :targetCol " +
                        "  AND kcu.table_schema NOT IN ('information_schema', 'pg_catalog')")
                .setParameter("targetTable", targetTable)
                .setParameter("targetCol", targetColumn)
                .getResultList();

        for (Object[] fk : fks) {
            String table = (String) fk[0];
            String column = (String) fk[1];
            String nullable = (String) fk[2];
            if ("YES".equals(nullable)) {
                entityManager.createNativeQuery("UPDATE " + table + " SET " + column + " = NULL WHERE " + column + " = :val")
                        .setParameter("val", targetId).executeUpdate();
            } else {
                entityManager.createNativeQuery("DELETE FROM " + table + " WHERE " + column + " = :val")
                        .setParameter("val", targetId).executeUpdate();
            }
        }
    }

    public Employee changeEmployeeStatus(Long id, String statusStr) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
        Employee.EmployeeStatus newStatus = Employee.EmployeeStatus.valueOf(statusStr);
        employee.setStatus(newStatus);
        if (employee.getUser() != null &&
                (newStatus == Employee.EmployeeStatus.suspended || newStatus == Employee.EmployeeStatus.terminated)) {
            employee.getUser().setEnabled(false);
            userRepository.save(employee.getUser());
        }
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
        if (branchId != null) return employeeRepository.findByUser_IdAndBranch_Id(userId, branchId);
        return employeeRepository.findAllByUserId(userId).stream().findFirst();
    }

    public List<Employee> getSubordinates(Long managerId) {
        return employeeRepository.findByManagerId(managerId);
    }
}
