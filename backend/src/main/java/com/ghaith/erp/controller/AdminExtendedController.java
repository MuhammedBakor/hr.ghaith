package com.ghaith.erp.controller;

import com.ghaith.erp.model.HrBranch;
import com.ghaith.erp.service.HrBranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/v1/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminExtendedController {

    private final HrBranchService hrBranchService;

    private static final List<Map<String, Object>> companies = new CopyOnWriteArrayList<>();
    private static final AtomicLong companyIdCounter = new AtomicLong(1);

    private static final List<Map<String, Object>> adminSettings = new CopyOnWriteArrayList<>();
    private static final AtomicLong settingIdCounter = new AtomicLong(1);

    private static final List<Map<String, Object>> automationRules = new CopyOnWriteArrayList<>();
    private static final AtomicLong ruleIdCounter = new AtomicLong(1);

    private static final List<Map<String, Object>> rolePacksList = new CopyOnWriteArrayList<>();
    private static final AtomicLong rolePackIdCounter = new AtomicLong(1);

    @GetMapping("")
    public ResponseEntity<?> getAdmin() {
        return ResponseEntity.ok(new HashMap<>());
    }

    // ===== Companies =====

    @GetMapping("/companies")
    public ResponseEntity<?> getCompanies() {
        return ResponseEntity.ok(companies);
    }

    @PostMapping("/companies")
    public ResponseEntity<?> createCompany(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", companyIdCounter.getAndIncrement());
        body.putIfAbsent("isActive", true);
        body.putIfAbsent("createdAt", new java.util.Date());
        companies.add(body);

        // Also create as HR branch so it appears in branch dropdown
        try {
            String code = body.getOrDefault("code", "COMP-" + body.get("id")).toString();
            String name = body.getOrDefault("name", "").toString();
            String nameAr = body.getOrDefault("nameAr", name).toString();
            String city = body.getOrDefault("city", "").toString();
            String phone = body.getOrDefault("phone", "").toString();
            String email = body.getOrDefault("email", "").toString();

            HrBranch branch = HrBranch.builder()
                .code(code)
                .name(name.isEmpty() ? nameAr : name)
                .nameAr(nameAr.isEmpty() ? name : nameAr)
                .city(city)
                .phone(phone)
                .email(email)
                .isActive(true)
                .build();
            HrBranch savedBranch = hrBranchService.createBranch(branch);
            body.put("branchId", savedBranch.getId());
        } catch (Exception e) {
            // Don't fail company creation if branch creation fails
        }

        return ResponseEntity.ok(body);
    }

    @PutMapping("/companies/{id}")
    public ResponseEntity<?> updateCompany(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> c : companies) {
            if (c.get("id") != null && c.get("id").toString().equals(id.toString())) {
                c.putAll(body);
                c.put("id", id);
                return ResponseEntity.ok(c);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/companies/{id}")
    public ResponseEntity<?> deleteCompany(@PathVariable Long id) {
        companies.removeIf(c -> c.get("id") != null && c.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Settings =====

    @GetMapping("/settings")
    public ResponseEntity<?> getSettings() {
        return ResponseEntity.ok(adminSettings);
    }

    @PostMapping("/settings")
    public ResponseEntity<?> createSetting(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", settingIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        adminSettings.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/settings/{id}")
    public ResponseEntity<?> updateSetting(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> s : adminSettings) {
            if (s.get("id") != null && s.get("id").toString().equals(id.toString())) {
                s.putAll(body);
                s.put("id", id);
                return ResponseEntity.ok(s);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/settings/{id}")
    public ResponseEntity<?> deleteSetting(@PathVariable Long id) {
        adminSettings.removeIf(s -> s.get("id") != null && s.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Automation Rules =====

    @GetMapping("/automation-rules")
    public ResponseEntity<?> getAutomationRules() {
        return ResponseEntity.ok(automationRules);
    }

    @PostMapping("/automation-rules")
    public ResponseEntity<?> createAutomationRule(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", ruleIdCounter.getAndIncrement());
        body.putIfAbsent("isActive", true);
        body.putIfAbsent("createdAt", new java.util.Date());
        automationRules.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/automation-rules/{id}")
    public ResponseEntity<?> updateAutomationRule(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> r : automationRules) {
            if (r.get("id") != null && r.get("id").toString().equals(id.toString())) {
                r.putAll(body);
                r.put("id", id);
                return ResponseEntity.ok(r);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/automation-rules/{id}")
    public ResponseEntity<?> deleteAutomationRule(@PathVariable Long id) {
        automationRules.removeIf(r -> r.get("id") != null && r.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Role Packs =====

    @GetMapping("/role-packs")
    public ResponseEntity<?> getRolePacks() {
        return ResponseEntity.ok(rolePacksList);
    }

    @PostMapping("/role-packs")
    public ResponseEntity<?> createRolePack(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", rolePackIdCounter.getAndIncrement());
        body.putIfAbsent("isActive", true);
        body.putIfAbsent("isDefault", false);
        body.putIfAbsent("createdAt", new java.util.Date());
        rolePacksList.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/role-packs/{id}")
    public ResponseEntity<?> updateRolePack(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> rp : rolePacksList) {
            if (rp.get("id") != null && rp.get("id").toString().equals(id.toString())) {
                rp.putAll(body);
                rp.put("id", id);
                return ResponseEntity.ok(rp);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/role-packs/{id}")
    public ResponseEntity<?> deleteRolePack(@PathVariable Long id) {
        rolePacksList.removeIf(rp -> rp.get("id") != null && rp.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Roles =====

    @GetMapping("/roles")
    public ResponseEntity<?> getRoles() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/roles")
    public ResponseEntity<?> createRole(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(body != null ? body : new HashMap<>());
    }

    // ===== Jobs =====

    @GetMapping("/jobs")
    public ResponseEntity<?> getJobs() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/jobs/cleanup")
    public ResponseEntity<?> cleanupJobs(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/jobs/release-stale")
    public ResponseEntity<?> releaseStaleJobs(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/jobs/stats")
    public ResponseEntity<?> getJobStats() {
        return ResponseEntity.ok(new HashMap<>());
    }

    // ===== Scheduler =====

    @GetMapping("/scheduler/job-statuses")
    public ResponseEntity<?> getSchedulerJobStatuses() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/scheduler/logs")
    public ResponseEntity<?> getSchedulerLogs() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/scheduler/run-job")
    public ResponseEntity<?> runSchedulerJob(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/scheduler/toggle-job")
    public ResponseEntity<?> toggleSchedulerJob(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Misc =====

    @GetMapping("/leaves")
    public ResponseEntity<?> getLeaves() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/purchase-orders")
    public ResponseEntity<?> getPurchaseOrders() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/rbac")
    public ResponseEntity<?> getRbac() {
        return ResponseEntity.ok(new HashMap<>());
    }

    @GetMapping("/exceptions/suspense-items")
    public ResponseEntity<?> getSuspenseItems() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/governance/failed-checks")
    public ResponseEntity<?> getFailedChecks() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/governance/protected-endpoints")
    public ResponseEntity<?> getProtectedEndpoints() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/timers/due")
    public ResponseEntity<?> getDueTimers() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/security/unban-ip")
    public ResponseEntity<?> unbanIp(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}
