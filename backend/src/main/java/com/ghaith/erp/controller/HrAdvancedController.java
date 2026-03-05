package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/hr-advanced")
@CrossOrigin(origins = "*")
public class HrAdvancedController {

    @GetMapping("/branches")
    public ResponseEntity<?> getBranches() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/departments")
    public ResponseEntity<?> getDepartments() {
        return ResponseEntity.ok(Collections.emptyList());
    }
}
