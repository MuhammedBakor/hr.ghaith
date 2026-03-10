package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/fleet-extended")
@CrossOrigin(origins = "*")
public class FleetExtendedController {

    @GetMapping("/violations")
    public ResponseEntity<?> getViolations() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", System.currentTimeMillis());
        return ResponseEntity.ok(body);
    }
}
