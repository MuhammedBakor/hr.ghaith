package com.ghaith.erp.service;

import com.ghaith.erp.dto.*;
import com.ghaith.erp.model.User;
import com.ghaith.erp.repository.UserRepository;
import com.ghaith.erp.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
        private final UserRepository repository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;

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
                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.getEmail(),
                                                request.getPassword()));
                var user = repository.findByEmail(request.getEmail())
                                .orElseThrow();
                var jwtToken = jwtService.generateToken(user);
                return AuthenticationResponse.builder()
                                .token(jwtToken)
                                .build();
        }

        public VerifyCodeResponse verifyCode(String code) {
                // Mock verification logic for now
                if (code != null && code.startsWith("GH-")) {
                        return VerifyCodeResponse.builder()
                                        .success(true)
                                        .subscription(VerifyCodeResponse.SubscriptionDto.builder()
                                                        .code(code)
                                                        .companyName("شركة غيث للتجارة")
                                                        .build())
                                        .build();
                }
                return VerifyCodeResponse.builder()
                                .success(false)
                                .error("رمز التفعيل غير صحيح")
                                .build();
        }

        public void sendResetCode(ResetCodeRequest request) {
                // Mock sending logic
                System.out.println("Sending reset code to " + request.getContact() + " via " + request.getMethod());
        }

        public void resetPassword(ResetPasswordRequest request) {
                User user = repository.findByUsername(request.getCode())
                                .or(() -> repository.findByEmail(request.getCode()))
                                .orElseThrow(() -> new RuntimeException("المستخدم غير موجود"));

                user.setPassword(passwordEncoder.encode(request.getNewPassword()));
                repository.save(user);
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
