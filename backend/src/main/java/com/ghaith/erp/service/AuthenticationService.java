package com.ghaith.erp.service;

import com.ghaith.erp.dto.*;
import com.ghaith.erp.model.User;
import com.ghaith.erp.model.Employee;
import com.ghaith.erp.model.Role;
import com.ghaith.erp.repository.UserRepository;
import com.ghaith.erp.repository.EmployeeRepository;
import com.ghaith.erp.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
        private final UserRepository repository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;
        private final EmployeeRepository employeeRepository;
        private final EmailService emailService;
        private static final java.security.SecureRandom random = new java.security.SecureRandom();

        public AuthenticationResponse register(RegisterRequest request) {
                var user = User.builder()
                                .username(request.getUsername())
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .role(request.getRole())
                                .build();
                repository.save(user);
                var jwtToken = jwtService.generateToken(user);
                return AuthenticationResponse.builder()
                                .token(jwtToken)
                                .build();
        }

        public AuthenticationResponse authenticate(AuthenticationRequest request) {
                // Find user by email (unique identity)
                var user = repository.findByEmail(request.getEmail().toLowerCase())
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                                                "خطأ في اسم المستخدم أو كلمة المرور"));

                // Get all employee records across all branches for this user
                List<Employee> employees = employeeRepository.findByUserId(user.getId());

                // Check roles: OWNER and GENERAL_MANAGER can login without employee record
                boolean isAdministrative = user.getRole() == Role.OWNER || user.getRole() == Role.GENERAL_MANAGER;

                if (employees.isEmpty() && !isAdministrative) {
                        // Regular users must have at least one employee record
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "هذا الحساب غير مرتبط بموظف.");
                }

                // Check if ALL accounts are suspended/terminated
                // But bypass this check for global administrative roles (OWNER/GM)
                if (!isAdministrative) {
                        boolean allSuspended = employees.stream()
                                        .allMatch(e -> e.getStatus() == Employee.EmployeeStatus.suspended);
                        boolean allTerminated = employees.stream()
                                        .allMatch(e -> e.getStatus() == Employee.EmployeeStatus.terminated);

                        if (allSuspended) {
                                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                                "تم إيقاف حسابك مؤقتاً في جميع الفروع. يرجى التواصل مع الإدارة.");
                        }
                        if (allTerminated) {
                                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                                "تم إنهاء خدمتك في جميع الفروع. لا يمكنك الوصول إلى النظام.");
                        }
                }

                try {
                        authenticationManager.authenticate(
                                        new UsernamePasswordAuthenticationToken(
                                                        request.getEmail(),
                                                        request.getPassword()));
                } catch (org.springframework.security.authentication.DisabledException e) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                        "الحساب غير مفعل، يرجى تفعيل الحساب أولاً باستخدام كود التفعيل المرسل لإيميلك");
                } catch (org.springframework.security.core.AuthenticationException e) {
                        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                                        "خطأ في اسم المستخدم أو كلمة المرور");
                }

                var jwtToken = jwtService.generateToken(user);

                // Build list of accessible branches
                List<BranchAccessDto> branches = employees.stream()
                                .map(emp -> BranchAccessDto.builder()
                                                .branchId(emp.getBranch() != null ? emp.getBranch().getId() : null)
                                                .branchName(emp.getBranch() != null ? emp.getBranch().getNameAr()
                                                                : "فرع غير معروف")
                                                .employeeId(emp.getId())
                                                .role(emp.getRole())
                                                .employeeStatus(emp.getStatus().name())
                                                .build())
                                .collect(java.util.stream.Collectors.toList());

                var responseBuilder = AuthenticationResponse.builder()
                                .token(jwtToken)
                                .branches(branches);

                // For backward compatibility, set the first non-suspended employee if possible
                employees.stream()
                                .filter(e -> e.getStatus() != Employee.EmployeeStatus.suspended
                                                && e.getStatus() != Employee.EmployeeStatus.terminated)
                                .findFirst()
                                .ifPresent(emp -> {
                                        responseBuilder.employeeId(emp.getId());
                                        responseBuilder.employeeStatus(emp.getStatus().name());
                                });

                return responseBuilder.build();
        }

        public VerifyCodeResponse verifyCode(String code) {
                return repository.findByVerificationCode(code)
                                .map(user -> VerifyCodeResponse.builder()
                                                .success(true)
                                                .subscription(VerifyCodeResponse.SubscriptionDto.builder()
                                                                .code(code)
                                                                .companyName("منصة غيث - حساب موظف")
                                                                .build())
                                                .build())
                                .orElseGet(() -> {
                                        // Fallback to existing mock logic for GH- codes if necessary,
                                        // or just return failure
                                        if (code != null && code.startsWith("GH-")) {
                                                return VerifyCodeResponse.builder()
                                                                .success(true)
                                                                .subscription(VerifyCodeResponse.SubscriptionDto
                                                                                .builder()
                                                                                .code(code)
                                                                                .companyName("شركة غيث للتجارة")
                                                                                .build())
                                                                .build();
                                        }
                                        return VerifyCodeResponse.builder()
                                                        .success(false)
                                                        .error("رمز التفعيل غير صحيح")
                                                        .build();
                                });
        }

        public void sendResetCode(ResetCodeRequest request) {
                User user = repository.findByEmail(request.getEmail())
                                .orElseThrow(() -> new RuntimeException("لا يوجد حساب مرتبط بهذا البريد الإلكتروني"));

                String code = String.valueOf(100000 + random.nextInt(900000));
                user.setVerificationCode(code);
                repository.save(user);

                String firstName = employeeRepository.findByUserId(user.getId()).stream()
                                .findFirst()
                                .map(Employee::getFirstName)
                                .orElse(request.getEmail());

                emailService.sendPasswordResetCode(request.getEmail(), firstName, code);
        }

        public void resetPassword(ResetPasswordRequest request) {
                User user = repository.findByEmail(request.getEmail())
                                .orElseThrow(() -> new RuntimeException("لا يوجد حساب مرتبط بهذا البريد الإلكتروني"));

                if (user.getVerificationCode() == null
                                || !user.getVerificationCode().equals(request.getVerificationCode())) {
                        throw new RuntimeException("رمز التحقق غير صحيح");
                }

                user.setPassword(passwordEncoder.encode(request.getNewPassword()));
                user.setEnabled(true);
                user.setVerificationCode(null);
                repository.save(user);

                employeeRepository.findByUserId(user.getId()).forEach(employee -> {
                        employee.setStatus(Employee.EmployeeStatus.active);
                        employeeRepository.save(employee);
                });
        }

        public java.util.Map<String, Object> verifyEmployeeInvitation(String employeeNumber, String activationCode) {
                java.util.Map<String, Object> response = new java.util.HashMap<>();

                var employeeOpt = employeeRepository.findByEmployeeNumber(employeeNumber);
                if (employeeOpt.isEmpty()) {
                        response.put("valid", false);
                        response.put("error", "الرقم الوظيفي غير صحيح");
                        return response;
                }

                Employee employee = employeeOpt.get();
                User user = employee.getUser();
                if (user == null || !activationCode.equals(user.getVerificationCode())) {
                        response.put("valid", false);
                        response.put("error", "كود التفعيل غير صحيح");
                        return response;
                }

                response.put("valid", true);
                response.put("employeeName", employee.getFirstName() + " " + employee.getLastName());
                response.put("email", employee.getEmail());
                return response;
        }

        public java.util.Map<String, Object> completeEmployeeInvitation(String employeeNumber, String activationCode,
                        String password) {
                java.util.Map<String, Object> response = new java.util.HashMap<>();

                var employeeOpt = employeeRepository.findByEmployeeNumber(employeeNumber);
                if (employeeOpt.isEmpty()) {
                        response.put("success", false);
                        response.put("error", "الرقم الوظيفي غير صحيح");
                        return response;
                }

                Employee employee = employeeOpt.get();
                User user = employee.getUser();
                if (user == null || !activationCode.equals(user.getVerificationCode())) {
                        response.put("success", false);
                        response.put("error", "كود التفعيل غير صحيح");
                        return response;
                }

                user.setPassword(passwordEncoder.encode(password));
                user.setEnabled(true);
                user.setVerificationCode(null);
                repository.save(user);

                employee.setStatus(Employee.EmployeeStatus.incomplete);
                employeeRepository.save(employee);

                // Generate token so employee can proceed to complete profile
                var jwtToken = jwtService.generateToken(user);

                response.put("success", true);
                response.put("token", jwtToken);
                response.put("employeeId", employee.getId());
                return response;
        }

        public UserResponse getMe() {
                var authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication == null || !authentication.isAuthenticated()
                                || "anonymousUser".equals(authentication.getPrincipal())) {
                        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "غير مفوض");
                }

                var userEmail = authentication.getName();
                var user = repository.findByEmail(userEmail)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                                "المستخدم غير موجود"));

                return UserResponse.builder()
                                .id(user.getId())
                                .username(user.getUsername())
                                .email(user.getEmail())
                                .role(user.getRole().name())
                                .roles(user.getAllRoles())
                                .build();
        }
}
