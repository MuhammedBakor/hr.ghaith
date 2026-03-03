package com.ghaith.erp.controller;

import com.ghaith.erp.model.FieldTrackingPoint;
import com.ghaith.erp.model.FieldTrackingSession;
import com.ghaith.erp.service.FieldTrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/hr/field-tracking")
@RequiredArgsConstructor
public class FieldTrackingController {
    private final FieldTrackingService trackingService;

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<List<FieldTrackingSession>> getSessionsByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(trackingService.getSessionsByEmployee(employeeId));
    }

    @PostMapping("/start")
    public ResponseEntity<FieldTrackingSession> startSession(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        Double lat = ((Number) payload.get("latitude")).doubleValue();
        Double lng = ((Number) payload.get("longitude")).doubleValue();
        return ResponseEntity.ok(trackingService.startSession(userId, lat, lng));
    }

    @PostMapping("/end")
    public ResponseEntity<FieldTrackingSession> endSession(@RequestBody Map<String, Object> payload) {
        Long sessionId = Long.valueOf(payload.get("sessionId").toString());
        Double lat = ((Number) payload.get("latitude")).doubleValue();
        Double lng = ((Number) payload.get("longitude")).doubleValue();
        return ResponseEntity.ok(trackingService.endSession(sessionId, lat, lng));
    }

    @PostMapping("/record-point")
    public ResponseEntity<FieldTrackingPoint> recordPoint(@RequestBody Map<String, Object> payload) {
        Long sessionId = Long.valueOf(payload.get("sessionId").toString());
        Double lat = ((Number) payload.get("latitude")).doubleValue();
        Double lng = ((Number) payload.get("longitude")).doubleValue();
        String type = (String) payload.get("pointType");
        Integer duration = payload.containsKey("stopDuration") ? ((Number) payload.get("stopDuration")).intValue()
                : null;
        String notes = (String) payload.get("notes");

        return ResponseEntity.ok(trackingService.recordPoint(sessionId, lat, lng, type, duration, notes));
    }
}
