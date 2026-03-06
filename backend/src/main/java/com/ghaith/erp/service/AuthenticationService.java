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
                return AuthenticationResponse.builder()
                                .token(jwtToken)
                                .build();
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
                // Mock sending logic
                System.out.println("Sending reset code to " + request.getContact() + " via " + request.getMethod());
        }

        public void resetPassword(ResetPasswordRequest request) {
                User user = repository.findByVerificationCode(request.getCode())
                                .or(() -> repository.findByUsername(request.getCode()))
                                .or(() -> repository.findByEmail(request.getCode()))
                                .orElseThrow(() -> new RuntimeException("المستخدم غير موجود أو رمز التفعيل خاطئ"));

                user.setPassword(passwordEncoder.encode(request.getNewPassword()));
                user.setEnabled(true);
                user.setVerificationCode(null);
                repository.save(user);

                // If this is an employee, update their status to active
                employeeRepository.findByUserId(user.getId()).ifPresent(employee -> {
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

        public java.util.Map<String, Object> completeEmployeeInvitation(String employeeNumber, String activationCode, String password) {
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

                employee.setStatus(Employee.EmployeeStatus.active);
                employeeRepository.save(employee);

                response.put("success", true);
                return response;
        }

        public UserResponse getMe() {
                var authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication == null || !authentication.isAuthenticated()) {
                        throw new RuntimeException("غير مفوض");
                }

                var userEmail = authentication.getName();
                var user = repository.findByEmail(userEmail)
                                .orElseThrow(() -> new RuntimeException("المستخدم غير موجود"));

                return UserResponse.builder()
                                .id(user.getId())
                                .username(user.getUsername())
                                .email(user.getEmail())
                                .role(user.getRole().name())
                                .build();
        }
}
