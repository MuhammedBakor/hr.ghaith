package com.ghaith.erp.controller;

import com.ghaith.erp.model.Employee;
import com.ghaith.erp.model.User;
import com.ghaith.erp.model.Violation;
import com.ghaith.erp.repository.EmployeeRepository;
import com.ghaith.erp.repository.ViolationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/hr/violations")
@RequiredArgsConstructor
public class ViolationController {

    private final ViolationRepository violationRepository;
    private final EmployeeRepository employeeRepository;

    /** GET /api/v1/hr/violations
     *  All roles can view their own violations; managers see all.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Violation>> getViolations(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Long sentByUserId) {

        if (employeeId != null) {
            return ResponseEntity.ok(violationRepository.findByEmployee_Id(employeeId));
        }
        if (sentByUserId != null) {
            return ResponseEntity.ok(violationRepository.findBySentByUserId(sentByUserId));
        }
        return ResponseEntity.ok(violationRepository.findAll());
    }

    /** POST /api/v1/hr/violations — supervisors and managers can issue violations */
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER','GENERAL_MANAGER','DEPARTEMENT_MANAGER','SUPERVISOR')")
    public ResponseEntity<?> createViolation(
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        Long employeeId = body.get("employeeId") != null
                ? Long.parseLong(body.get("employeeId").toString()) : null;
        if (employeeId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "employeeId مطلوب"));
        }

        Optional<Employee> empOpt = employeeRepository.findById(employeeId);
        if (empOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Resolve current user info from Spring Security context
        String sentByName = "غير محدد";
        String sentByRole = "";
        Long sentByUserId = null;

        if (authentication != null && authentication.getPrincipal() instanceof User currentUser) {
            sentByUserId = currentUser.getId();
            sentByName = currentUser.getUsername();
            sentByRole = currentUser.getRole() != null ? currentUser.getRole().name() : "";
            // Try to get the employee's full name for the sender
            List<Employee> senderEmps = employeeRepository.findAllByUserId(currentUser.getId());
            if (!senderEmps.isEmpty()) {
                Employee se = senderEmps.get(0);
                sentByName = se.getFirstName() + " " + se.getLastName();
            }
        }

        String violationType = body.getOrDefault("violationType", "").toString();
        String description = body.getOrDefault("description", "").toString();
        String violationDateStr = body.getOrDefault("violationDate", "").toString();
        LocalDate violationDate = violationDateStr.isEmpty() ? LocalDate.now() : LocalDate.parse(violationDateStr);

        Violation violation = Violation.builder()
                .employee(empOpt.get())
                .violationType(violationType)
                .description(description)
                .violationDate(violationDate)
                .status("sent")
                .sentByUserId(sentByUserId)
                .sentByName(sentByName)
                .sentByRole(sentByRole)
                .build();

        return ResponseEntity.ok(violationRepository.save(violation));
    }

    /** PUT /api/v1/hr/violations/{id} — update (only the sender or admin can edit) */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateViolation(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {

        Optional<Violation> opt = violationRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Violation violation = opt.get();

        // Authorization: only the original sender or admin/GM can edit
        if (authentication != null && authentication.getPrincipal() instanceof User currentUser) {
            boolean isSender = currentUser.getId().equals(violation.getSentByUserId());
            boolean isAdmin = "ADMIN".equals(currentUser.getRole() != null ? currentUser.getRole().name() : "")
                    || "GENERAL_MANAGER".equals(currentUser.getRole() != null ? currentUser.getRole().name() : "");
            if (!isSender && !isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "ليس لديك صلاحية تعديل هذه المخالفة"));
            }
        }

        if (body.get("violationType") != null) violation.setViolationType(body.get("violationType").toString());
        if (body.get("description") != null) violation.setDescription(body.get("description").toString());
        if (body.get("violationDate") != null) violation.setViolationDate(LocalDate.parse(body.get("violationDate").toString()));
        if (body.get("status") != null) violation.setStatus(body.get("status").toString());

        return ResponseEntity.ok(violationRepository.save(violation));
    }

    /** POST /api/v1/hr/violations/{id}/appeal — employee submits appeal within 15 days */
    @PostMapping("/{id}/appeal")
    public ResponseEntity<?> appealViolation(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body) {

        Optional<Violation> opt = violationRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Violation violation = opt.get();

        // Check 15-day window
        if (violation.getViolationDate() != null) {
            long daysSince = java.time.temporal.ChronoUnit.DAYS.between(violation.getViolationDate(), LocalDate.now());
            if (daysSince > 15) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "انتهت مدة الاستئناف (15 يوماً)"));
            }
        }

        if ("submitted".equals(violation.getAppealStatus())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "تم تقديم استئناف بالفعل على هذه المخالفة"));
        }

        String reason = body != null && body.get("reason") != null ? body.get("reason").toString() : "";
        violation.setAppealStatus("submitted");
        violation.setAppealReason(reason);

        return ResponseEntity.ok(violationRepository.save(violation));
    }

    /** DELETE /api/v1/hr/violations/{id} — delete (only sender or admin can delete) */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteViolation(
            @PathVariable Long id,
            Authentication authentication) {

        Optional<Violation> opt = violationRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Violation violation = opt.get();

        if (authentication != null && authentication.getPrincipal() instanceof User currentUser) {
            boolean isSender = currentUser.getId().equals(violation.getSentByUserId());
            boolean isAdmin = "ADMIN".equals(currentUser.getRole() != null ? currentUser.getRole().name() : "")
                    || "GENERAL_MANAGER".equals(currentUser.getRole() != null ? currentUser.getRole().name() : "");
            if (!isSender && !isAdmin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("message", "ليس لديك صلاحية حذف هذه المخالفة"));
            }
        }

        violationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
