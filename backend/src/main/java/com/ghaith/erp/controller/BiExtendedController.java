package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/bi")
@CrossOrigin(origins = "*")
public class BiExtendedController {

    @GetMapping("/dashboard-stats")
    public ResponseEntity<?> getDashboardStats() {
        return ResponseEntity.ok(new HashMap<>());
    }

    @GetMapping("/widgets")
    public ResponseEntity<?> getWidgets() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/data-sources")
    public ResponseEntity<?> getDataSources() {
        return ResponseEntity.ok(Collections.emptyList());
    }
}
