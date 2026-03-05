package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/property")
@CrossOrigin(origins = "*")
public class PropertyController {

    @GetMapping("")
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return ResponseEntity.ok(new HashMap<>());
    }

    @GetMapping("/properties")
    public ResponseEntity<?> getProperties() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/units")
    public ResponseEntity<?> getUnits() {
        return ResponseEntity.ok(Collections.emptyList());
    }
}
