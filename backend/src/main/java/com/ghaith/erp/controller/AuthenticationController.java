package com.ghaith.erp.controller;

import com.ghaith.erp.dto.*;
import com.ghaith.erp.service.AuthenticationService;
import com.ghaith.erp.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService service;
    private final SessionService sessionService;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(
            @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(service.register(request));
    }

    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponse> authenticate(
            @RequestBody AuthenticationRequest request) {
        return ResponseEntity.ok(service.authenticate(request));
    }

    @GetMapping("/verify-code")
    public ResponseEntity<VerifyCodeResponse> verifyCode(@RequestParam String code) {
        return ResponseEntity.ok(service.verifyCode(code));
    }

    @PostMapping("/send-reset-code")
    public ResponseEntity<Void> sendResetCode(@RequestBody ResetCodeRequest request) {
        service.sendResetCode(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody ResetPasswordRequest request) {
        service.resetPassword(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe() {
        return ResponseEntity.ok(service.getMe());
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getAllSessions() {
        return ResponseEntity.ok(sessionService.getAllSessions());
    }

    @PostMapping("/sessions/terminate")
    public ResponseEntity<Void> terminateSession(@RequestBody java.util.Map<String, String> payload) {
        sessionService.terminateSession(payload.get("sessionId"));
        return ResponseEntity.ok().build();
    }
}
