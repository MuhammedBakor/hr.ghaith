package com.ghaith.erp.controller;

import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class MiscController {

    private final RolePackRepository rolePackRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    private static final List<Map<String, Object>> requests = new CopyOnWriteArrayList<>();
    private static final AtomicLong requestIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> requestTypes = new CopyOnWriteArrayList<>();
    private static final AtomicLong requestTypeIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> requestWorkflows = new CopyOnWriteArrayList<>();
    private static final AtomicLong workflowIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> workflowTemplates = new CopyOnWriteArrayList<>();
    private static final AtomicLong templateIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> documents = new CopyOnWriteArrayList<>();
    private static final AtomicLong documentIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> documentTemplates = new CopyOnWriteArrayList<>();
    private static final AtomicLong documentTemplateIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> documentArchive = new CopyOnWriteArrayList<>();
    private static final AtomicLong archiveIdCounter = new AtomicLong(1);

    @GetMapping("/roles")
    public ResponseEntity<?> getRoles() {
        return ResponseEntity.ok(rolePackRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping("/roles")
    public ResponseEntity<?> createRole(@RequestBody Map<String, Object> body) {
        RolePack role = RolePack.builder()
                .code(String.valueOf(body.getOrDefault("name", "")))
                .name(String.valueOf(body.getOrDefault("name", "")))
                .nameAr(String.valueOf(body.getOrDefault("nameAr", "")))
                .description(body.get("description") != null ? String.valueOf(body.get("description")) : null)
                .permissions(body.get("permissions") != null ? String.valueOf(body.get("permissions")) : null)
                .category(body.get("level") != null ? String.valueOf(body.get("level")) : null)
                .isActive(true)
                .isDefault(false)
                .build();
        return ResponseEntity.ok(rolePackRepository.save(role));
    }

    @PutMapping("/roles/{id}")
    public ResponseEntity<?> updateRole(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return rolePackRepository.findById(id).map(role -> {
            if (body.get("name") != null) {
                role.setName(String.valueOf(body.get("name")));
                role.setCode(String.valueOf(body.get("name")));
            }
            if (body.get("nameAr") != null)
                role.setNameAr(String.valueOf(body.get("nameAr")));
            if (body.containsKey("description"))
                role.setDescription(body.get("description") != null ? String.valueOf(body.get("description")) : null);
            if (body.get("permissions") != null)
                role.setPermissions(String.valueOf(body.get("permissions")));
            if (body.get("level") != null)
                role.setCategory(String.valueOf(body.get("level")));
            if (body.get("isActive") != null)
                role.setIsActive(Boolean.parseBoolean(String.valueOf(body.get("isActive"))));
            return ResponseEntity.ok(rolePackRepository.save(role));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/roles/{id}")
    public ResponseEntity<?> deleteRole(@PathVariable Long id) {
        if (!rolePackRepository.existsById(id))
            return ResponseEntity.notFound().build();
        rolePackRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/roles/seed-defaults")
    public ResponseEntity<?> seedDefaultRoles(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/role-packs")
    public ResponseEntity<?> getRolePacks() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/role-packs")
    public ResponseEntity<?> createRolePack(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(body != null ? body : new HashMap<>());
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getSessions() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/kernel/companies")
    public ResponseEntity<?> getKernelCompanies() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/setup/progress")
    public ResponseEntity<?> getSetupProgress() {
        Map<String, Object> response = new HashMap<>();
        response.put("progress", 100);
        response.put("completed", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/setup/status")
    public ResponseEntity<?> getSetupStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "complete");
        response.put("initialized", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/anomaly-rules")
    public ResponseEntity<?> getAnomalyRules() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/anomaly-rules/stats")
    public ResponseEntity<?> getAnomalyRulesStats() {
        return ResponseEntity.ok(new HashMap<>());
    }

    @PostMapping("/anomaly-rules")
    public ResponseEntity<?> createAnomalyRule(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null)
            body = new HashMap<>();
        body.put("id", System.currentTimeMillis());
        return ResponseEntity.ok(body);
    }

    @PutMapping("/anomaly-rules/{id}/toggle")
    public ResponseEntity<?> toggleAnomalyRule(@PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("id", id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/anomaly-rules/{id}")
    public ResponseEntity<?> deleteAnomalyRule(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/policies")
    public ResponseEntity<?> getPolicies() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/policies")
    public ResponseEntity<?> createPolicy(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null)
            body = new HashMap<>();
        body.put("id", System.currentTimeMillis());
        return ResponseEntity.ok(body);
    }

    @PutMapping("/policies/{id}")
    public ResponseEntity<?> updatePolicy(@PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        if (body == null)
            body = new HashMap<>();
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/documents")
    public ResponseEntity<?> getDocuments() {
        return ResponseEntity.ok(documents);
    }

    @PostMapping("/documents")
    public ResponseEntity<?> createDocument(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null)
            body = new HashMap<>();
        body.put("id", documentIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        documents.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/documents/{id}")
    public ResponseEntity<?> updateDocument(@PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        if (body == null)
            body = new HashMap<>();
        for (Map<String, Object> doc : documents) {
            if (doc.get("id") != null && doc.get("id").toString().equals(id.toString())) {
                doc.putAll(body);
                doc.put("id", id);
                return ResponseEntity.ok(doc);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id) {
        documents.removeIf(d -> d.get("id") != null && d.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Document Templates =====

    @GetMapping("/documents/templates")
    public ResponseEntity<?> getDocumentTemplates() {
        return ResponseEntity.ok(documentTemplates);
    }

    @PostMapping("/documents/templates")
    public ResponseEntity<?> createDocumentTemplate(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null)
            body = new HashMap<>();
        body.put("id", documentTemplateIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        documentTemplates.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/documents/templates/{id}")
    public ResponseEntity<?> updateDocumentTemplate(@PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        if (body == null)
            body = new HashMap<>();
        for (Map<String, Object> tmpl : documentTemplates) {
            if (tmpl.get("id") != null && tmpl.get("id").toString().equals(id.toString())) {
                tmpl.putAll(body);
                tmpl.put("id", id);
                return ResponseEntity.ok(tmpl);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/documents/templates/{id}")
    public ResponseEntity<?> deleteDocumentTemplate(@PathVariable Long id) {
        documentTemplates.removeIf(tmpl -> tmpl.get("id") != null && tmpl.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Document Archive =====

    @GetMapping("/documents/archive")
    public ResponseEntity<?> getDocumentArchive() {
        return ResponseEntity.ok(documentArchive);
    }

    @PostMapping("/documents/{id}/archive")
    public ResponseEntity<?> archiveDocument(@PathVariable Long id) {
        for (Map<String, Object> doc : documents) {
            if (doc.get("id") != null && doc.get("id").toString().equals(id.toString())) {
                Map<String, Object> archived = new HashMap<>(doc);
                archived.put("archiveId", archiveIdCounter.getAndIncrement());
                archived.put("archivedAt", new java.util.Date());
                documentArchive.add(archived);
                documents.remove(doc);
                return ResponseEntity.ok(archived);
            }
        }
        Map<String, Object> response = new HashMap<>();
        response.put("archiveId", archiveIdCounter.getAndIncrement());
        response.put("documentId", id);
        response.put("archivedAt", new java.util.Date());
        documentArchive.add(response);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/documents/archive/{id}/restore")
    public ResponseEntity<?> restoreDocument(@PathVariable Long id) {
        for (Map<String, Object> archived : documentArchive) {
            if ((archived.get("archiveId") != null && archived.get("archiveId").toString().equals(id.toString()))
                    || (archived.get("id") != null && archived.get("id").toString().equals(id.toString()))) {
                documentArchive.remove(archived);
                archived.remove("archiveId");
                archived.remove("archivedAt");
                documents.add(archived);
                return ResponseEntity.ok(archived);
            }
        }
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/documents/archive/{id}")
    public ResponseEntity<?> deleteArchivedDocument(@PathVariable Long id) {
        documentArchive
                .removeIf(a -> (a.get("archiveId") != null && a.get("archiveId").toString().equals(id.toString()))
                        || (a.get("id") != null && a.get("id").toString().equals(id.toString())));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Logs =====

    @GetMapping("/logs/messages")
    public ResponseEntity<?> getLogMessages() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/evidence-packs")
    public ResponseEntity<?> getEvidencePacks() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/evidence-packs/stats")
    public ResponseEntity<?> getEvidencePacksStats() {
        return ResponseEntity.ok(new HashMap<>());
    }

    @GetMapping("/insurance")
    public ResponseEntity<?> getInsurance() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/reservations")
    public ResponseEntity<?> getReservations() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/reserves")
    public ResponseEntity<?> getReserves() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    private static final List<Map<String, Object>> subscriptions = new CopyOnWriteArrayList<>();
    private static final AtomicLong subscriptionIdCounter = new AtomicLong(1);

    @GetMapping("/subscriptions")
    public ResponseEntity<?> getSubscriptions(@RequestParam(required = false) String status) {
        if (status != null && !status.equals("all")) {
            List<Map<String, Object>> filtered = subscriptions.stream()
                    .filter(s -> status.equals(s.get("status")))
                    .toList();
            return ResponseEntity.ok(filtered);
        }
        return ResponseEntity.ok(subscriptions);
    }

    @PostMapping("/subscriptions")
    public ResponseEntity<?> createSubscription(@RequestBody Map<String, Object> body) {
        Map<String, Object> sub = new LinkedHashMap<>(body);
        long id = subscriptionIdCounter.getAndIncrement();
        sub.put("id", id);
        sub.put("subscriptionCode", "SUB-" + String.format("%05d", id));
        sub.put("status", "active");
        sub.put("createdAt", new Date().toString());
        subscriptions.add(sub);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("subscriptionCode", sub.get("subscriptionCode"));
        result.put("data", sub);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/subscriptions/{id}/status")
    public ResponseEntity<?> updateSubscriptionStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        for (Map<String, Object> sub : subscriptions) {
            if (id.equals(((Number) sub.get("id")).longValue())) {
                sub.put("status", body.get("status"));
                Map<String, Object> result = new LinkedHashMap<>();
                result.put("success", true);
                result.put("data", sub);
                return ResponseEntity.ok(result);
            }
        }
        return ResponseEntity.ok(Map.of("success", false, "error", "الاشتراك غير موجود"));
    }

    @PostMapping("/subscriptions/{id}/resend-welcome")
    public ResponseEntity<?> resendWelcome(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/subscriptions/available-modules")
    public ResponseEntity<?> getAvailableModules() {
        List<Map<String, Object>> modules = List.of(
                Map.of("id", 1, "name", "HR", "nameAr", "الموارد البشرية"),
                Map.of("id", 2, "name", "Finance", "nameAr", "المالية"),
                Map.of("id", 3, "name", "Legal", "nameAr", "الشؤون القانونية"),
                Map.of("id", 4, "name", "Correspondence", "nameAr", "المراسلات"),
                Map.of("id", 5, "name", "Fleet", "nameAr", "إدارة الأسطول"),
                Map.of("id", 6, "name", "Property", "nameAr", "إدارة الممتلكات"),
                Map.of("id", 7, "name", "Support", "nameAr", "الدعم الفني"));
        return ResponseEntity.ok(modules);
    }

    @GetMapping("/delegations")
    public ResponseEntity<?> getDelegations() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/state-transitions")
    public ResponseEntity<?> getStateTransitions() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/pending-balances")
    public ResponseEntity<?> getPendingBalances() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(@RequestParam(defaultValue = "100") int limit) {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/print-templates")
    public ResponseEntity<?> getPrintTemplates() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/print-templates/render")
    public ResponseEntity<?> renderPrintTemplate(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(body != null ? body : new HashMap<>());
    }

    @PostMapping("/print/generate")
    public ResponseEntity<?> generatePrint(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(body != null ? body : new HashMap<>());
    }

    @PostMapping("/print/log")
    public ResponseEntity<?> logPrint(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/public-site/pages")
    public ResponseEntity<?> getPublicSitePages() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/approval-settings")
    public ResponseEntity<?> getApprovalSettings() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/approval-settings")
    public ResponseEntity<?> createApprovalSettings(@RequestBody(required = false) Map<String, Object> body) {
        return ResponseEntity.ok(body != null ? body : new HashMap<>());
    }

    @GetMapping("/beneficiary-rules")
    public ResponseEntity<?> getBeneficiaryRules() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/beneficiary-rules/toggle-active")
    public ResponseEntity<?> toggleBeneficiaryRule(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/control-kernel/list")
    public ResponseEntity<?> getControlKernelList() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/control-kernel/branches")
    public ResponseEntity<?> getControlKernelBranches() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/control-kernel/roles")
    public ResponseEntity<?> getControlKernelRoles() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    // ===== Requests =====

    @GetMapping("/requests")
    public ResponseEntity<?> getRequests(
            @RequestParam(required = false) Long requesterId,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String status) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        User currentUser = userRepository.findByEmail(userEmail).orElse(null);

        if (currentUser == null) {
            return ResponseEntity.status(401).body(Map.of("message", "User not found"));
        }

        Employee currentEmployee = employeeRepository.findAllByUserId(currentUser.getId())
                .stream().findFirst().orElse(null);

        List<Map<String, Object>> result = filterByVisibility(new ArrayList<>(requests), currentUser, currentEmployee);

        // Additional filtering by params if provided
        if (requesterId != null) {
            result = result.stream()
                    .filter(r -> requesterId.toString().equals(String.valueOf(r.get("requesterId"))))
                    .collect(java.util.stream.Collectors.toList());
        }
        if (departmentId != null) {
            result = result.stream()
                    .filter(r -> departmentId.toString().equals(String.valueOf(r.get("requesterDepartmentId"))))
                    .collect(java.util.stream.Collectors.toList());
        }
        if (status != null && !status.isEmpty()) {
            result = result.stream()
                    .filter(r -> status.equals(r.get("status")))
                    .collect(java.util.stream.Collectors.toList());
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/requests")
    public ResponseEntity<?> createRequest(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null)
            body = new HashMap<>();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        User currentUser = userRepository.findByEmail(userEmail).orElse(null);

        if (currentUser != null) {
            body.put("requesterId", currentUser.getId());
            body.put("requesterName", currentUser.getUsername());
            body.put("requesterRole", currentUser.getRole().toString());

            Employee emp = employeeRepository.findAllByUserId(currentUser.getId()).stream().findFirst().orElse(null);
            if (emp != null) {
                if (emp.getFirstName() != null) {
                    body.put("requesterName", emp.getFirstName() + " " + emp.getLastName());
                }
                if (emp.getDepartment() != null) {
                    body.put("requesterDepartment", emp.getDepartment().getNameAr());
                    body.put("requesterDepartmentId", emp.getDepartment().getId());
                }
                if (emp.getBranch() != null) {
                    body.put("requesterBranch", emp.getBranch().getNameAr());
                }
            }
        }

        body.put("id", requestIdCounter.getAndIncrement());
        body.putIfAbsent("status", "pending");
        body.putIfAbsent("createdAt", new java.util.Date());
        requests.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/requests/{id}")
    public ResponseEntity<?> updateRequest(@PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        if (body == null)
            body = new HashMap<>();
        for (Map<String, Object> req : requests) {
            if (req.get("id") != null && req.get("id").toString().equals(id.toString())) {
                req.putAll(body);
                req.put("id", id);
                req.put("updatedAt", new java.util.Date());
                // Track who approved/rejected
                if (body.containsKey("approverName")) {
                    req.put("approverName", body.get("approverName"));
                }
                return ResponseEntity.ok(req);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/requests/{id}")
    public ResponseEntity<?> deleteRequest(@PathVariable Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        User currentUser = userRepository.findByEmail(userEmail).orElse(null);

        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }

        Role role = currentUser.getRole();
        boolean isOwnerOrGM = role == Role.OWNER || role == Role.GENERAL_MANAGER;

        boolean removed = requests.removeIf(req -> {
            if (req.get("id") != null && req.get("id").toString().equals(id.toString())) {
                if (isOwnerOrGM)
                    return true;
                Object requesterId = req.get("requesterId");
                return requesterId != null && requesterId.toString().equals(currentUser.getId().toString());
            }
            return false;
        });

        if (removed) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "لا تملك صلاحية حذف هذا الطلب أو الطلب غير موجود"));
        }
    }

    // ===== Request Types =====

    @GetMapping("/requests/types")
    public ResponseEntity<?> getRequestTypes() {
        return ResponseEntity.ok(requestTypes);
    }

    @PostMapping("/requests/types")
    public ResponseEntity<?> createRequestType(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null)
            body = new HashMap<>();
        body.put("id", requestTypeIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        requestTypes.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/requests/types/{id}")
    public ResponseEntity<?> updateRequestType(@PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        if (body == null)
            body = new HashMap<>();
        for (Map<String, Object> rt : requestTypes) {
            if (rt.get("id") != null && rt.get("id").toString().equals(id.toString())) {
                rt.putAll(body);
                rt.put("id", id);
                return ResponseEntity.ok(rt);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/requests/types/{id}")
    public ResponseEntity<?> deleteRequestType(@PathVariable Long id) {
        requestTypes.removeIf(rt -> rt.get("id") != null && rt.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Request Workflows =====

    @GetMapping("/requests/workflows")
    public ResponseEntity<?> getRequestWorkflows() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        User currentUser = userRepository.findByEmail(userEmail).orElse(null);
        Employee currentEmployee = currentUser != null ? employeeRepository.findAllByUserId(currentUser.getId())
                .stream().findFirst().orElse(null) : null;

        if (currentUser == null)
            return ResponseEntity.status(401).build();

        List<Map<String, Object>> result = filterByVisibility(new ArrayList<>(requestWorkflows), currentUser,
                currentEmployee);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/requests/workflows")
    public ResponseEntity<?> createRequestWorkflow(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null)
            body = new HashMap<>();
        body.put("id", workflowIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        requestWorkflows.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/requests/workflows/{id}")
    public ResponseEntity<?> updateRequestWorkflow(@PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        if (body == null)
            body = new HashMap<>();
        for (Map<String, Object> wf : requestWorkflows) {
            if (wf.get("id") != null && wf.get("id").toString().equals(id.toString())) {
                wf.putAll(body);
                wf.put("id", id);
                return ResponseEntity.ok(wf);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/requests/workflows/{id}")
    public ResponseEntity<?> deleteRequestWorkflow(@PathVariable Long id) {
        requestWorkflows.removeIf(wf -> wf.get("id") != null && wf.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Workflow Templates =====

    @GetMapping("/workflow/templates")
    public ResponseEntity<?> getWorkflowTemplates() {
        return ResponseEntity.ok(workflowTemplates);
    }

    @PostMapping("/workflow/templates")
    public ResponseEntity<?> createWorkflowTemplate(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null)
            body = new HashMap<>();
        body.put("id", templateIdCounter.getAndIncrement());
        body.putIfAbsent("isActive", true);
        body.putIfAbsent("createdAt", new java.util.Date());
        workflowTemplates.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/workflow/templates/{id}")
    public ResponseEntity<?> updateWorkflowTemplate(@PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        if (body == null)
            body = new HashMap<>();
        for (Map<String, Object> t : workflowTemplates) {
            if (t.get("id") != null && t.get("id").toString().equals(id.toString())) {
                t.putAll(body);
                t.put("id", id);
                return ResponseEntity.ok(t);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/workflow/templates/{id}")
    public ResponseEntity<?> deleteWorkflowTemplate(@PathVariable Long id) {
        workflowTemplates.removeIf(t -> t.get("id") != null && t.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Workflow Approvals =====

    @GetMapping("/workflow/approvals")
    public ResponseEntity<?> getWorkflowApprovals() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        User currentUser = userRepository.findByEmail(userEmail).orElse(null);
        Employee currentEmployee = currentUser != null ? employeeRepository.findAllByUserId(currentUser.getId())
                .stream().findFirst().orElse(null) : null;

        if (currentUser == null)
            return ResponseEntity.status(401).build();

        // Return pending requests as workflow approvals
        List<Map<String, Object>> pending = requests.stream()
                .filter(r -> "pending".equals(r.get("status")))
                .collect(java.util.stream.Collectors.toList());

        List<Map<String, Object>> filtered = filterByVisibility(pending, currentUser, currentEmployee);
        return ResponseEntity.ok(filtered);
    }

    @PostMapping("/workflow/approvals/{id}/approve")
    public ResponseEntity<?> approveWorkflow(@PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        for (Map<String, Object> req : requests) {
            if (req.get("id") != null && req.get("id").toString().equals(id.toString())) {
                req.put("status", "approved");
                req.put("updatedAt", new java.util.Date());
                if (body != null && body.containsKey("approverName")) {
                    req.put("approverName", body.get("approverName"));
                }
                return ResponseEntity.ok(req);
            }
        }
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("id", id);
        response.put("status", "approved");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/workflow/approvals/{id}/reject")
    public ResponseEntity<?> rejectWorkflow(@PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {
        for (Map<String, Object> req : requests) {
            if (req.get("id") != null && req.get("id").toString().equals(id.toString())) {
                req.put("status", "rejected");
                req.put("updatedAt", new java.util.Date());
                if (body != null) {
                    if (body.containsKey("approverName"))
                        req.put("approverName", body.get("approverName"));
                    if (body.containsKey("reason"))
                        req.put("rejectionReason", body.get("reason"));
                }
                return ResponseEntity.ok(req);
            }
        }
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("id", id);
        response.put("status", "rejected");
        return ResponseEntity.ok(response);
    }

    private List<Map<String, Object>> filterByVisibility(List<Map<String, Object>> list, User currentUser,
            Employee currentEmployee) {
        Role role = currentUser.getRole();
        if (role == Role.OWNER || role == Role.GENERAL_MANAGER) {
            return list;
        }

        if (role == Role.DEPARTEMENT_MANAGER && currentEmployee != null && currentEmployee.getDepartment() != null) {
            Long myDeptId = currentEmployee.getDepartment().getId();
            return list.stream()
                    .filter(r -> {
                        Object rDeptId = r.get("requesterDepartmentId");
                        Object rid = r.get("requesterId");
                        return (rDeptId != null && rDeptId.toString().equals(myDeptId.toString())) ||
                                (rid != null && rid.toString().equals(currentUser.getId().toString()));
                    })
                    .collect(java.util.stream.Collectors.toList());
        }

        // Default: SUPERVISOR, EMPLOYEE, AGENT - only see their own
        return list.stream()
                .filter(r -> {
                    Object rid = r.get("requesterId");
                    return rid != null && rid.toString().equals(currentUser.getId().toString());
                })
                .collect(java.util.stream.Collectors.toList());
    }
}
