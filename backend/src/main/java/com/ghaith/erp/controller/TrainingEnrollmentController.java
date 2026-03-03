package com.ghaith.erp.controller;

import com.ghaith.erp.model.TrainingEnrollment;
import com.ghaith.erp.service.TrainingEnrollmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/training/enrollments")
@RequiredArgsConstructor
public class TrainingEnrollmentController {

    private final TrainingEnrollmentService service;

    @GetMapping
    public ResponseEntity<List<TrainingEnrollment>> getAllEnrollments() {
        return ResponseEntity.ok(service.getAllEnrollments());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<TrainingEnrollment>> getEnrollmentsByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(service.getEnrollmentsByEmployee(employeeId));
    }

    @GetMapping("/program/{programId}")
    public ResponseEntity<List<TrainingEnrollment>> getEnrollmentsByProgram(@PathVariable Long programId) {
        return ResponseEntity.ok(service.getEnrollmentsByProgram(programId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrainingEnrollment> getEnrollmentById(@PathVariable Long id) {
        return service.getEnrollmentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TrainingEnrollment> enrollEmployee(@RequestBody TrainingEnrollment enrollment) {
        return ResponseEntity.ok(service.enrollEmployee(enrollment));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrainingEnrollment> updateEnrollment(@PathVariable Long id,
            @RequestBody TrainingEnrollment enrollment) {
        try {
            return ResponseEntity.ok(service.updateEnrollment(id, enrollment));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEnrollment(@PathVariable Long id) {
        service.deleteEnrollment(id);
        return ResponseEntity.noContent().build();
    }
}
