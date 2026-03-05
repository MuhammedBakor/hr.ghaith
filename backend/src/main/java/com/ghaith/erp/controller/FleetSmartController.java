package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/fleet-smart")
@CrossOrigin(origins = "*")
public class FleetSmartController {

    @GetMapping("")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/overdue-maintenances")
    public ResponseEntity<?> getOverdueMaintenances() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/complete-and-schedule-next")
    public ResponseEntity<?> completeAndScheduleNext(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}
