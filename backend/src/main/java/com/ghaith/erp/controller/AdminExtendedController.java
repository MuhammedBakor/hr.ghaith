package com.ghaith.erp.controller;

import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.*;
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
    private final AdminCompanyRepository adminCompanyRepository;
    private final AdminSettingRepository adminSettingRepository;
    private final AutomationRuleRepository automationRuleRepository;
    private final RolePackRepository rolePackRepository;

    @GetMapping("")
    public ResponseEntity<?> getAdmin() {
        return ResponseEntity.ok(new HashMap<>());
    }

    // ===== Companies (Database-backed) =====

    @GetMapping("/companies")
    public ResponseEntity<?> getCompanies() {
        return ResponseEntity.ok(adminCompanyRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping("/companies")
    public ResponseEntity<?> createCompany(@RequestBody(required = false) AdminCompany body) {
        if (body == null) body = new AdminCompany();
        if (body.getIsActive() == null) body.setIsActive(true);

        AdminCompany saved = adminCompanyRepository.save(body);

        // Also create as HR branch so it appears in branch dropdown
        try {
            String code = body.getCode() != null ? body.getCode() : "COMP-" + saved.getId();
            String name = body.getName() != null ? body.getName() : "";
            String nameAr = body.getNameAr() != null ? body.getNameAr() : name;
            String city = body.getCity() != null ? body.getCity() : "";
            String phone = body.getPhone() != null ? body.getPhone() : "";
            String email = body.getEmail() != null ? body.getEmail() : "";

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
            saved.setBranchId(savedBranch.getId());
            saved = adminCompanyRepository.save(saved);
        } catch (Exception e) {
            // Don't fail company creation if branch creation fails
        }

        return ResponseEntity.ok(saved);
    }

    @PutMapping("/companies/{id}")
    public ResponseEntity<?> updateCompany(@PathVariable Long id, @RequestBody(required = false) AdminCompany body) {
        return adminCompanyRepository.findById(id).map(existing -> {
            if (body.getName() != null) existing.setName(body.getName());
            if (body.getNameAr() != null) existing.setNameAr(body.getNameAr());
            if (body.getCode() != null) existing.setCode(body.getCode());
            if (body.getCity() != null) existing.setCity(body.getCity());
            if (body.getPhone() != null) existing.setPhone(body.getPhone());
            if (body.getEmail() != null) existing.setEmail(body.getEmail());
            if (body.getAddress() != null) existing.setAddress(body.getAddress());
            if (body.getType() != null) existing.setType(body.getType());
            if (body.getTaxNumber() != null) existing.setTaxNumber(body.getTaxNumber());
            if (body.getDescription() != null) existing.setDescription(body.getDescription());
            if (body.getIsActive() != null) existing.setIsActive(body.getIsActive());
            return ResponseEntity.ok(adminCompanyRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/companies/{id}")
    public ResponseEntity<?> deleteCompany(@PathVariable Long id) {
        if (!adminCompanyRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        adminCompanyRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ===== Settings (Database-backed) =====

    @GetMapping("/settings")
    public ResponseEntity<?> getSettings() {
        return ResponseEntity.ok(adminSettingRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping("/settings")
    public ResponseEntity<?> createSetting(@RequestBody(required = false) AdminSetting body) {
        if (body == null) body = new AdminSetting();
        if (body.getIsActive() == null) body.setIsActive(true);
        return ResponseEntity.ok(adminSettingRepository.save(body));
    }

    @PutMapping("/settings/{id}")
    public ResponseEntity<?> updateSetting(@PathVariable Long id, @RequestBody(required = false) AdminSetting body) {
        return adminSettingRepository.findById(id).map(existing -> {
            if (body.getName() != null) existing.setName(body.getName());
            if (body.getNameAr() != null) existing.setNameAr(body.getNameAr());
            if (body.getLabel() != null) existing.setLabel(body.getLabel());
            if (body.getLabelAr() != null) existing.setLabelAr(body.getLabelAr());
            if (body.getCategory() != null) existing.setCategory(body.getCategory());
            if (body.getScope() != null) existing.setScope(body.getScope());
            if (body.getType() != null) existing.setType(body.getType());
            if (body.getKey() != null) existing.setKey(body.getKey());
            if (body.getValue() != null) existing.setValue(body.getValue());
            if (body.getDescription() != null) existing.setDescription(body.getDescription());
            if (body.getIsActive() != null) existing.setIsActive(body.getIsActive());
            return ResponseEntity.ok(adminSettingRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/settings/{id}")
    public ResponseEntity<?> deleteSetting(@PathVariable Long id) {
        if (!adminSettingRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        adminSettingRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ===== Automation Rules (Database-backed) =====

    @GetMapping("/automation-rules")
    public ResponseEntity<?> getAutomationRules() {
        return ResponseEntity.ok(automationRuleRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping("/automation-rules")
    public ResponseEntity<?> createAutomationRule(@RequestBody(required = false) AutomationRule body) {
        if (body == null) body = new AutomationRule();
        if (body.getIsActive() == null) body.setIsActive(true);
        return ResponseEntity.ok(automationRuleRepository.save(body));
    }

    @PutMapping("/automation-rules/{id}")
    public ResponseEntity<?> updateAutomationRule(@PathVariable Long id, @RequestBody(required = false) AutomationRule body) {
        return automationRuleRepository.findById(id).map(existing -> {
            if (body.getCode() != null) existing.setCode(body.getCode());
            if (body.getName() != null) existing.setName(body.getName());
            if (body.getNameAr() != null) existing.setNameAr(body.getNameAr());
            if (body.getTriggerType() != null) existing.setTriggerType(body.getTriggerType());
            if (body.getTriggerEvent() != null) existing.setTriggerEvent(body.getTriggerEvent());
            if (body.getActionType() != null) existing.setActionType(body.getActionType());
            if (body.getActionConfig() != null) existing.setActionConfig(body.getActionConfig());
            if (body.getTrigger() != null) existing.setTrigger(body.getTrigger());
            if (body.getAction() != null) existing.setAction(body.getAction());
            if (body.getModule() != null) existing.setModule(body.getModule());
            if (body.getConditions() != null) existing.setConditions(body.getConditions());
            if (body.getDescription() != null) existing.setDescription(body.getDescription());
            if (body.getIsActive() != null) existing.setIsActive(body.getIsActive());
            return ResponseEntity.ok(automationRuleRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/automation-rules/{id}")
    public ResponseEntity<?> deleteAutomationRule(@PathVariable Long id) {
        if (!automationRuleRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        automationRuleRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ===== Role Packs (Database-backed) =====

    @GetMapping("/role-packs")
    public ResponseEntity<?> getRolePacks() {
        return ResponseEntity.ok(rolePackRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping("/role-packs")
    public ResponseEntity<?> createRolePack(@RequestBody(required = false) RolePack body) {
        if (body == null) body = new RolePack();
        if (body.getIsActive() == null) body.setIsActive(true);
        if (body.getIsDefault() == null) body.setIsDefault(false);
        return ResponseEntity.ok(rolePackRepository.save(body));
    }

    @PutMapping("/role-packs/{id}")
    public ResponseEntity<?> updateRolePack(@PathVariable Long id, @RequestBody(required = false) RolePack body) {
        return rolePackRepository.findById(id).map(existing -> {
            if (body.getCode() != null) existing.setCode(body.getCode());
            if (body.getName() != null) existing.setName(body.getName());
            if (body.getNameAr() != null) existing.setNameAr(body.getNameAr());
            if (body.getCategory() != null) existing.setCategory(body.getCategory());
            if (body.getPermissions() != null) existing.setPermissions(body.getPermissions());
            if (body.getDescription() != null) existing.setDescription(body.getDescription());
            if (body.getIsActive() != null) existing.setIsActive(body.getIsActive());
            if (body.getIsDefault() != null) existing.setIsDefault(body.getIsDefault());
            return ResponseEntity.ok(rolePackRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/role-packs/{id}")
    public ResponseEntity<?> deleteRolePack(@PathVariable Long id) {
        if (!rolePackRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        rolePackRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
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

    // ===== Jobs (in-memory, transient by nature) =====

    private static final List<Map<String, Object>> jobsList = new CopyOnWriteArrayList<>();
    private static final AtomicLong jobIdCounter = new AtomicLong(1);

    @GetMapping("/jobs")
    public ResponseEntity<?> getJobs(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false, defaultValue = "50") int limit) {
        List<Map<String, Object>> filtered = new ArrayList<>(jobsList);
        if (status != null && !status.isEmpty()) {
            filtered.removeIf(j -> !status.equals(j.get("status")));
        }
        if (type != null && !type.isEmpty()) {
            filtered.removeIf(j -> !type.equals(j.get("type")));
        }
        if (filtered.size() > limit) {
            filtered = filtered.subList(0, limit);
        }
        Map<String, Object> response = new HashMap<>();
        response.put("jobs", filtered);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/jobs")
    public ResponseEntity<?> createJob(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", String.valueOf(jobIdCounter.getAndIncrement()));
        body.putIfAbsent("status", "pending");
        body.putIfAbsent("attempts", 0);
        body.putIfAbsent("maxAttempts", 3);
        body.putIfAbsent("priority", 5);
        body.putIfAbsent("createdAt", new java.util.Date());
        body.putIfAbsent("scheduledAt", new java.util.Date());
        jobsList.add(0, body);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<?> getJobById(@PathVariable String jobId) {
        for (Map<String, Object> job : jobsList) {
            if (jobId.equals(job.get("id"))) {
                Map<String, Object> response = new HashMap<>();
                response.put("job", job);
                response.put("logs", job.getOrDefault("logs", Collections.emptyList()));
                return ResponseEntity.ok(response);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/jobs/{jobId}/retry")
    public ResponseEntity<?> retryJob(@PathVariable String jobId) {
        for (Map<String, Object> job : jobsList) {
            if (jobId.equals(job.get("id"))) {
                job.put("status", "pending");
                job.put("attempts", 0);
                job.put("scheduledAt", new java.util.Date());
                return ResponseEntity.ok(Map.of("success", true, "job", job));
            }
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/jobs/{jobId}/cancel")
    public ResponseEntity<?> cancelJob(@PathVariable String jobId) {
        for (Map<String, Object> job : jobsList) {
            if (jobId.equals(job.get("id"))) {
                job.put("status", "cancelled");
                return ResponseEntity.ok(Map.of("success", true, "job", job));
            }
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/jobs/cleanup")
    public ResponseEntity<?> cleanupJobs(@RequestBody(required = false) Map<String, Object> body) {
        int olderThanDays = 30;
        if (body != null && body.get("olderThanDays") != null) {
            olderThanDays = Integer.parseInt(body.get("olderThanDays").toString());
        }
        long cutoff = System.currentTimeMillis() - ((long) olderThanDays * 24 * 60 * 60 * 1000);
        int before = jobsList.size();
        jobsList.removeIf(j -> {
            Object created = j.get("createdAt");
            if (created instanceof java.util.Date) {
                return ((java.util.Date) created).getTime() < cutoff
                    && ("completed".equals(j.get("status")) || "cancelled".equals(j.get("status")) || "failed".equals(j.get("status")));
            }
            return false;
        });
        return ResponseEntity.ok(Map.of("success", true, "deleted", before - jobsList.size()));
    }

    @PostMapping("/jobs/release-stale")
    public ResponseEntity<?> releaseStaleJobs(@RequestBody(required = false) Map<String, Object> body) {
        int released = 0;
        for (Map<String, Object> job : jobsList) {
            if ("processing".equals(job.get("status"))) {
                job.put("status", "pending");
                released++;
            }
        }
        return ResponseEntity.ok(Map.of("success", true, "released", released));
    }

    @GetMapping("/jobs/stats")
    public ResponseEntity<?> getJobStats() {
        long pending = jobsList.stream().filter(j -> "pending".equals(j.get("status"))).count();
        long processing = jobsList.stream().filter(j -> "processing".equals(j.get("status"))).count();
        long completed = jobsList.stream().filter(j -> "completed".equals(j.get("status"))).count();
        long failed = jobsList.stream().filter(j -> "failed".equals(j.get("status"))).count();
        long cancelled = jobsList.stream().filter(j -> "cancelled".equals(j.get("status"))).count();

        return ResponseEntity.ok(Map.of(
            "stats", Map.of(
                "pending", pending, "processing", processing, "completed", completed,
                "failed", failed, "cancelled", cancelled, "total", jobsList.size()
            )
        ));
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
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/scheduler/toggle-job")
    public ResponseEntity<?> toggleSchedulerJob(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(Map.of("success", true));
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

    @PostMapping("/rbac")
    public ResponseEntity<?> createRbac(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", body);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/rbac/{id}")
    public ResponseEntity<?> deleteRbac(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/role-packs/{id}/permissions")
    public ResponseEntity<?> getRolePackPermissions(@PathVariable Long id) {
        return ResponseEntity.ok(Collections.emptyList());
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
        return ResponseEntity.ok(Map.of("success", true));
    }
}
