package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/hr-branches")
@CrossOrigin(origins = "*")
public class HrBranchesAliasController {

    @GetMapping
    public ResponseEntity<?> getAllBranches() {
        return ResponseEntity.ok(Collections.emptyList());
    }
}
