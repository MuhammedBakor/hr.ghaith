package com.ghaith.erp.controller;

import com.ghaith.erp.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/hr/employee-onboarding")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class HrOnboardingController {

    private final EmployeeService employeeService;

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

    @PutMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        try {
            Object employeeIdObj = body.get("employeeId");
            if (employeeIdObj == null) {
                response.put("success", false);
                response.put("error", "معرف الموظف مطلوب");
                return ResponseEntity.badRequest().body(response);
            }
            Long employeeId = Long.valueOf(employeeIdObj.toString());
            employeeService.updateEmployeeSelfService(employeeId, body);
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
