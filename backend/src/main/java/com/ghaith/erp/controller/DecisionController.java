package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/decisions")
@CrossOrigin(origins = "*")
public class DecisionController {

    @GetMapping("")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("")
    public ResponseEntity<?> create(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(body != null ? body : new HashMap<>());
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        return ResponseEntity.ok(new HashMap<>());
    }
}
