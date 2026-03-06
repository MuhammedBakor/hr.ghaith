package com.ghaith.erp.controller;

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
    public ResponseEntity<List<Employee>> getAllEmployees() {
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
                    .ok(employeeService.createSimpleEmployee(firstName, lastName, email, phone, branchId, departmentId, positionId, role, managerId));
        } catch (Exception e) {
            e.printStackTrace(); // This will show in the console
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Employee> getEmployeeByUserId(@PathVariable Long userId) {
        return employeeService.getEmployeeByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/subordinates")
    public ResponseEntity<List<Employee>> getSubordinates(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getSubordinates(id));
    }
}
