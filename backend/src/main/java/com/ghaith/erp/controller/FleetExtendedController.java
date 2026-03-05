package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/fleet-extended")
@CrossOrigin(origins = "*")
public class FleetExtendedController {

    @GetMapping("")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/drivers")
    public ResponseEntity<?> getDrivers() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/fuel-logs")
    public ResponseEntity<?> getFuelLogs() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/fuel-logs")
    public ResponseEntity<?> createFuelLog(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(body != null ? body : new HashMap<>());
    }

    @GetMapping("/trips")
    public ResponseEntity<?> getTrips() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/violations")
    public ResponseEntity<?> getViolations() {
        return ResponseEntity.ok(Collections.emptyList());
    }
}
