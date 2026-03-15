package com.ghaith.erp.controller;

import com.ghaith.erp.model.Shift;
import com.ghaith.erp.service.ShiftService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/hr/shifts")
@RequiredArgsConstructor
public class ShiftController {
    private final ShiftService shiftService;

    @GetMapping
    public ResponseEntity<List<Shift>> getAllShifts() {
        return ResponseEntity.ok(shiftService.getAllShifts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Shift> getShiftById(@PathVariable Long id) {
        return ResponseEntity.ok(shiftService.getShiftById(id));
    }

    @PostMapping
    public ResponseEntity<Shift> createShift(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(shiftService.createShiftFromPayload(payload));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Shift> updateShift(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(shiftService.updateShiftFromPayload(id, payload));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShift(@PathVariable Long id) {
        shiftService.deleteShift(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/seed-defaults")
    public ResponseEntity<Void> seedDefaults() {
        shiftService.seedDefaults();
        return ResponseEntity.ok().build();
    }
}
