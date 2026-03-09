package com.ghaith.erp.controller;

import com.ghaith.erp.model.*;
import com.ghaith.erp.service.LegalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/legal")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LegalController {

    private final LegalService legalService;

    // ==================== Contracts ====================

    @GetMapping("/contracts")
    public ResponseEntity<Map<String, Object>> getAllContracts(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "15") int pageSize,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        List<LegalContract> all = legalService.getAllContracts();
        // Filter by status
        if (status != null && !status.isEmpty()) {
            all = all.stream().filter(c -> status.equals(c.getStatus())).toList();
        }
        // Filter by search
        if (search != null && !search.isEmpty()) {
            String s = search.toLowerCase();
            all = all.stream().filter(c ->
                (c.getTitle() != null && c.getTitle().toLowerCase().contains(s)) ||
                (c.getPartyA() != null && c.getPartyA().toLowerCase().contains(s)) ||
                (c.getPartyB() != null && c.getPartyB().toLowerCase().contains(s)) ||
                (c.getPartyName() != null && c.getPartyName().toLowerCase().contains(s))
            ).toList();
        }
        int total = all.size();
        int totalPages = (int) Math.ceil((double) total / pageSize);
        int start = Math.min((page - 1) * pageSize, total);
        int end = Math.min(start + pageSize, total);
        List<LegalContract> items = all.subList(start, end);

        Map<String, Object> result = new HashMap<>();
        result.put("items", items);
        Map<String, Object> pagination = new HashMap<>();
        pagination.put("total", total);
        pagination.put("totalPages", totalPages);
        pagination.put("current", page);
        result.put("pagination", pagination);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/contracts")
    public ResponseEntity<LegalContract> createContract(@RequestBody LegalContract contract) {
        return ResponseEntity.ok(legalService.createContract(contract));
    }

    @PutMapping("/contracts/{id}")
    public ResponseEntity<LegalContract> updateContract(@PathVariable Long id, @RequestBody LegalContract contract) {
        contract.setId(id);
        return ResponseEntity.ok(legalService.createContract(contract));
    }

    @DeleteMapping("/contracts/{id}")
    public ResponseEntity<Void> deleteContract(@PathVariable Long id) {
        List<LegalContract> contracts = legalService.getAllContracts();
        contracts.removeIf(c -> c.getId().equals(id));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/contracts/expiring")
    public ResponseEntity<List<LegalContract>> getExpiringContracts() {
        List<LegalContract> all = legalService.getAllContracts();
        // Return contracts expiring within 30 days, or empty if none
        return ResponseEntity.ok(all.stream()
                .filter(c -> c.getEndDate() != null && c.getEndDate().isBefore(java.time.LocalDate.now().plusDays(30)))
                .toList());
    }

    @PostMapping("/contracts/{id}/renew")
    public ResponseEntity<LegalContract> renewContract(@PathVariable Long id) {
        return ResponseEntity.ok(legalService.renewContract(id));
    }

    // ==================== Cases ====================

    @GetMapping("/cases")
    public ResponseEntity<Map<String, Object>> getAllCases(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "15") int pageSize,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        List<LegalCase> all = legalService.getAllCases();
        if (status != null && !status.isEmpty()) {
            all = all.stream().filter(c -> status.equals(c.getStatus())).toList();
        }
        if (search != null && !search.isEmpty()) {
            String s = search.toLowerCase();
            all = all.stream().filter(c ->
                (c.getTitle() != null && c.getTitle().toLowerCase().contains(s)) ||
                (c.getCaseNumber() != null && c.getCaseNumber().toLowerCase().contains(s)) ||
                (c.getCourt() != null && c.getCourt().toLowerCase().contains(s))
            ).toList();
        }
        int total = all.size();
        int totalPages = (int) Math.ceil((double) total / pageSize);
        int start = Math.min((page - 1) * pageSize, total);
        int end = Math.min(start + pageSize, total);
        List<LegalCase> items = all.subList(start, end);

        Map<String, Object> result = new HashMap<>();
        result.put("items", items);
        Map<String, Object> pagination = new HashMap<>();
        pagination.put("total", total);
        pagination.put("totalPages", totalPages);
        pagination.put("current", page);
        result.put("pagination", pagination);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/cases")
    public ResponseEntity<LegalCase> createCase(@RequestBody LegalCase legalCase) {
        return ResponseEntity.ok(legalService.createCase(legalCase));
    }

    @PutMapping("/cases/{id}")
    public ResponseEntity<LegalCase> updateCase(@PathVariable Long id, @RequestBody LegalCase legalCase) {
        legalCase.setId(id);
        return ResponseEntity.ok(legalService.createCase(legalCase));
    }

    @DeleteMapping("/cases/{id}")
    public ResponseEntity<Void> deleteCase(@PathVariable Long id) {
        List<LegalCase> cases = legalService.getAllCases();
        cases.removeIf(c -> c.getId().equals(id));
        return ResponseEntity.ok().build();
    }

    // ==================== Documents ====================

    @GetMapping("/documents")
    public ResponseEntity<List<LegalDocument>> getAllDocuments(@RequestParam(required = false) String type) {
        return ResponseEntity.ok(legalService.getAllDocuments(type));
    }

    @PostMapping("/documents")
    public ResponseEntity<LegalDocument> createDocument(@RequestBody LegalDocument document) {
        return ResponseEntity.ok(legalService.createDocument(document));
    }

    @PutMapping("/documents/{id}")
    public ResponseEntity<LegalDocument> updateDocument(@PathVariable Long id, @RequestBody LegalDocument document) {
        document.setId(id);
        return ResponseEntity.ok(legalService.createDocument(document));
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long id) {
        List<LegalDocument> documents = legalService.getAllDocuments(null);
        documents.removeIf(d -> d.getId().equals(id));
        return ResponseEntity.ok().build();
    }

    // ==================== Tasks ====================

    @GetMapping("/tasks")
    public ResponseEntity<List<LegalTask>> getAllTasks() {
        return ResponseEntity.ok(legalService.getAllTasks());
    }

    @PostMapping("/tasks")
    public ResponseEntity<LegalTask> createTask(@RequestBody LegalTask task) {
        return ResponseEntity.ok(legalService.createTask(task));
    }

    // ==================== Stats ====================

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<LegalContract> allContracts = legalService.getAllContracts();
        List<LegalCase> allCases = legalService.getAllCases();

        Map<String, Object> contracts = new HashMap<>();
        contracts.put("total", allContracts.size());
        contracts.put("active", allContracts.stream().filter(c -> "active".equals(c.getStatus())).count());
        contracts.put("expiring", allContracts.stream().filter(c ->
            c.getEndDate() != null && c.getStatus() != null && c.getStatus().equals("active") &&
            c.getEndDate().isBefore(java.time.LocalDate.now().plusDays(30))
        ).count());

        Map<String, Object> cases = new HashMap<>();
        long openCases = allCases.stream().filter(c -> "open".equals(c.getStatus()) || "in_progress".equals(c.getStatus())).count();
        long wonCases = allCases.stream().filter(c -> "won".equals(c.getStatus())).count();
        long closedCases = allCases.stream().filter(c -> "closed".equals(c.getStatus()) || "won".equals(c.getStatus()) || "lost".equals(c.getStatus())).count();
        cases.put("total", allCases.size());
        cases.put("open", openCases);
        cases.put("winRate", closedCases > 0 ? Math.round((double) wonCases / closedCases * 100) : 0);

        Map<String, Object> stats = new HashMap<>();
        stats.put("contracts", contracts);
        stats.put("cases", cases);
        stats.put("totalDocuments", legalService.getAllDocuments(null).size());
        stats.put("pendingTasks", legalService.getAllTasks().size());
        return ResponseEntity.ok(stats);
    }

    // ==================== Audit ====================

    @GetMapping("/audit")
    public ResponseEntity<List<Object>> getAuditLog() {
        return ResponseEntity.ok(Collections.emptyList());
    }
}
