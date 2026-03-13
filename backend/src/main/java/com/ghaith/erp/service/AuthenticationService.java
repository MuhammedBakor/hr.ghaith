package com.ghaith.erp.service;

import com.ghaith.erp.dto.*;
import com.ghaith.erp.model.User;
import com.ghaith.erp.model.Employee;
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
                // Check employee status before authentication
                var userOpt = repository.findByEmail(request.getEmail());
                if (userOpt.isPresent()) {
                        var user = userOpt.get();
                        var employees = employeeRepository.findAllByUserId(user.getId());
                        for (var emp : employees) {
                                if (emp.getStatus() == Employee.EmployeeStatus.suspended) {
                                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                                        "تم إيقاف حسابك مؤقتاً في "
                                                                        + (emp.getBranch() != null
                                                                                        ? emp.getBranch().getName()
                                                                                        : "أحد الفروع")
                                                                        + ". يرجى التواصل مع المدير العام.");
                                }
                                if (emp.getStatus() == Employee.EmployeeStatus.terminated) {
                                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                                        "تم إنهاء خدمتك في "
                                                                        + (emp.getBranch() != null
                                                                                        ? emp.getBranch().getName()
                                                                                        : "أحد الفروع")
                                                                        + ". يرجى التواصل مع قسم الموارد البشرية.");
                                }
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
                var user = repository.findByEmail(request.getEmail())
                                .orElseThrow();
                var jwtToken = jwtService.generateToken(user);

                // Include employee status and ID in response (use first one as default)
                var employeesForResponse = employeeRepository.findAllByUserId(user.getId());
                var responseBuilder = AuthenticationResponse.builder().token(jwtToken);
                if (!employeesForResponse.isEmpty()) {
                        var empForResponse = employeesForResponse.get(0);
                        responseBuilder.employeeStatus(empForResponse.getStatus().name());
                        responseBuilder.employeeId(empForResponse.getId());
                        responseBuilder.hasMultipleBranches(employeesForResponse.size() > 1);
                }
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

                String firstName = employeeRepository.findAllByUserId(user.getId()).stream()
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

                employeeRepository.findAllByUserId(user.getId()).forEach(employee -> {
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
                // If user exists and is already enabled (activated in another branch), skip
                // password setup
                response.put("userExists", user != null && user.isEnabled());
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

                // Only set password if provided (skip for existing users)
                if (password != null && !password.isEmpty()) {
                        user.setPassword(passwordEncoder.encode(password));
                }
                user.setEnabled(true);
                user.setVerificationCode(null);
                repository.save(user);

                // If admin already filled basic info (full add), mark as active instead of
                // incomplete
                boolean profileComplete = employee.getNationalId() != null && !employee.getNationalId().isEmpty();
                employee.setStatus(
                                profileComplete ? Employee.EmployeeStatus.active : Employee.EmployeeStatus.incomplete);
                employeeRepository.save(employee);

                // Generate token so employee can proceed to complete profile
                var jwtToken = jwtService.generateToken(user);

                response.put("success", true);
                response.put("token", jwtToken);
                response.put("employeeId", employee.getId());
                response.put("profileComplete", profileComplete);
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
