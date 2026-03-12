package com.ghaith.erp.controller;

import com.ghaith.erp.exception.DuplicateEmailException;
import com.ghaith.erp.model.Employee;
import com.ghaith.erp.service.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/hr/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<List<Employee>> getAllEmployees(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long departmentId) {
        if (branchId != null && departmentId != null) {
            return ResponseEntity.ok(employeeService.getAllEmployeesByBranchAndDepartment(branchId, departmentId));
        }
        if (branchId != null) {
            return ResponseEntity.ok(employeeService.getAllEmployeesByBranch(branchId));
        }
        if (departmentId != null) {
            return ResponseEntity.ok(employeeService.getAllEmployeesByDepartment(departmentId));
        }
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Employee> getEmployeeById(@PathVariable Long id) {
        return employeeService.getEmployeeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Employee> createEmployee(@RequestBody Employee employee) {
        return ResponseEntity.ok(employeeService.createEmployee(employee));
    }

    @PostMapping("/simple")
    public ResponseEntity<?> createSimpleEmployee(@RequestBody java.util.Map<String, Object> payload) {
        try {
            String firstName = payload.get("firstName") != null ? payload.get("firstName").toString() : null;
            String lastName = payload.get("lastName") != null ? payload.get("lastName").toString() : null;
            String email = payload.get("email") != null ? payload.get("email").toString() : null;
            String phone = payload.get("phone") != null ? payload.get("phone").toString() : null;
            String role = payload.get("role") != null ? payload.get("role").toString() : null;

            Long branchId = null;
            Object branchIdObj = payload.get("branchId");
            if (branchIdObj instanceof Number) {
                branchId = ((Number) branchIdObj).longValue();
            } else if (branchIdObj instanceof String && !((String) branchIdObj).isEmpty()) {
                branchId = Long.parseLong((String) branchIdObj);
            }

            Long departmentId = null;
            Object deptIdObj = payload.get("departmentId");
            if (deptIdObj instanceof Number) {
                departmentId = ((Number) deptIdObj).longValue();
            } else if (deptIdObj instanceof String && !((String) deptIdObj).isEmpty()) {
                departmentId = Long.parseLong((String) deptIdObj);
            }

            Long positionId = null;
            Object posIdObj = payload.get("positionId");
            if (posIdObj instanceof Number) {
                positionId = ((Number) posIdObj).longValue();
            } else if (posIdObj instanceof String && !((String) posIdObj).isEmpty()) {
                positionId = Long.parseLong((String) posIdObj);
            }

            Long managerId = null;
            Object mgrIdObj = payload.get("managerId");
            if (mgrIdObj instanceof Number) {
                managerId = ((Number) mgrIdObj).longValue();
            } else if (mgrIdObj instanceof String && !((String) mgrIdObj).isEmpty()) {
                managerId = Long.parseLong((String) mgrIdObj);
            }

            return ResponseEntity
                    .ok(employeeService.createSimpleEmployee(firstName, lastName, email, phone, branchId, departmentId,
                            positionId, role, managerId));
        } catch (DuplicateEmailException e) {
            return ResponseEntity.status(409)
                    .body(java.util.Map.of("error", "EMAIL_EXISTS", "message", e.getMessage()));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(java.util.Map.of("error", "UNKNOWN", "message", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(java.util.Map.of("error", "UNKNOWN", "message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/invite")
    public ResponseEntity<Void> inviteEmployee(@PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload) {
        String method = payload.get("method");
        employeeService.inviteEmployee(id, method);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Employee> updateEmployee(@PathVariable Long id, @RequestBody Employee employee) {
        try {
            return ResponseEntity.ok(employeeService.updateEmployee(id, employee));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateEmployeeStatus(@PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload) {
        try {
            String status = payload.get("status");
            System.out.println("[STATUS] Received PATCH /employees/" + id + "/status with status=" + status);
            if (status == null) {
                return ResponseEntity.badRequest().body(java.util.Map.of("error", "Status is required"));
            }
            Employee updated = employeeService.changeEmployeeStatus(id, status);
            System.out.println("[STATUS] changeEmployeeStatus returned. Employee id=" + updated.getId() + ", status="
                    + updated.getStatus());
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("id", updated.getId());
            response.put("status", updated.getStatus().name());
            response.put("firstName", updated.getFirstName());
            response.put("lastName", updated.getLastName());
            System.out.println("[STATUS] Returning response: " + response);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            System.out.println("[STATUS] IllegalArgumentException: " + e.getMessage());
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Invalid status value"));
        } catch (Exception e) {
            System.out.println("[STATUS] Exception: " + e.getClass().getName() + " - " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEmployee(@PathVariable Long id) {
        try {
            employeeService.deleteEmployee(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(java.util.Map.of("error", "DELETE_FAILED", "message", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Employee> getEmployeeByUserId(
            @PathVariable Long userId,
            @RequestParam(required = false) Long branchId) {
        return employeeService.getEmployeeByUserIdAndBranch(userId, branchId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/subordinates")
    public ResponseEntity<List<Employee>> getSubordinates(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getSubordinates(id));
    }
}
