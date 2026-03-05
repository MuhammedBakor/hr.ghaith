package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/hr/employee-onboarding")
@CrossOrigin(origins = "*")
public class HrOnboardingController {

    @PostMapping("/activate")
    public ResponseEntity<?> activate(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pending-requests")
    public ResponseEntity<?> getPendingRequests() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/review")
    public ResponseEntity<?> review(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(body != null ? body : new HashMap<>());
    }

    @PostMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(body != null ? body : new HashMap<>());
    }
}
