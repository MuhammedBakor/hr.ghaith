package com.ghaith.erp.controller;

import com.ghaith.erp.model.TrainingProgram;
import com.ghaith.erp.service.TrainingProgramService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/training/programs")
@RequiredArgsConstructor
public class TrainingProgramController {

    private final TrainingProgramService service;

    @GetMapping
    public ResponseEntity<List<TrainingProgram>> getAllPrograms() {
        return ResponseEntity.ok(service.getAllPrograms());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrainingProgram> getProgramById(@PathVariable Long id) {
        return service.getProgramById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<TrainingProgram> createProgram(@RequestBody TrainingProgram program) {
        return ResponseEntity.ok(service.createProgram(program));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrainingProgram> updateProgram(@PathVariable Long id, @RequestBody TrainingProgram program) {
        try {
            return ResponseEntity.ok(service.updateProgram(id, program));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProgram(@PathVariable Long id) {
        service.deleteProgram(id);
        return ResponseEntity.noContent().build();
    }
}
