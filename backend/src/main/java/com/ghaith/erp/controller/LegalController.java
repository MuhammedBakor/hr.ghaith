package com.ghaith.erp.controller;

import com.ghaith.erp.model.*;
import com.ghaith.erp.service.LegalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/legal")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LegalController {

    private final LegalService legalService;

    @GetMapping("/contracts")
    public ResponseEntity<List<LegalContract>> getAllContracts() {
        return ResponseEntity.ok(legalService.getAllContracts());
    }

    @PostMapping("/contracts")
    public ResponseEntity<LegalContract> createContract(@RequestBody LegalContract contract) {
        return ResponseEntity.ok(legalService.createContract(contract));
    }

    @PostMapping("/contracts/{id}/renew")
    public ResponseEntity<LegalContract> renewContract(@PathVariable Long id) {
        return ResponseEntity.ok(legalService.renewContract(id));
    }

    @GetMapping("/cases")
    public ResponseEntity<List<LegalCase>> getAllCases() {
        return ResponseEntity.ok(legalService.getAllCases());
    }

    @PostMapping("/cases")
    public ResponseEntity<LegalCase> createCase(@RequestBody LegalCase legalCase) {
        return ResponseEntity.ok(legalService.createCase(legalCase));
    }

    @GetMapping("/documents")
    public ResponseEntity<List<LegalDocument>> getAllDocuments(@RequestParam(required = false) String type) {
        return ResponseEntity.ok(legalService.getAllDocuments(type));
    }

    @PostMapping("/documents")
    public ResponseEntity<LegalDocument> createDocument(@RequestBody LegalDocument document) {
        return ResponseEntity.ok(legalService.createDocument(document));
    }

    @GetMapping("/tasks")
    public ResponseEntity<List<LegalTask>> getAllTasks() {
        return ResponseEntity.ok(legalService.getAllTasks());
    }

    @PostMapping("/tasks")
    public ResponseEntity<LegalTask> createTask(@RequestBody LegalTask task) {
        return ResponseEntity.ok(legalService.createTask(task));
    }
}
