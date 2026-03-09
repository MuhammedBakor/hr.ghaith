package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/v1/comms")
@CrossOrigin(origins = "*")
public class CommsController {

    private static final List<Map<String, Object>> correspondences = new CopyOnWriteArrayList<>();
    private static final AtomicLong correspondenceIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> officialComms = new CopyOnWriteArrayList<>();
    private static final AtomicLong officialIdCounter = new AtomicLong(1);

    // ===== Correspondences =====

    @GetMapping("/correspondences")
    public ResponseEntity<?> getCorrespondences() {
        return ResponseEntity.ok(correspondences);
    }

    @GetMapping("/correspondences/stats")
    public ResponseEntity<?> getCorrespondenceStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", correspondences.size());
        stats.put("draft", correspondences.stream().filter(c -> "draft".equals(c.get("status"))).count());
        stats.put("sent", correspondences.stream().filter(c -> "sent".equals(c.get("status"))).count());
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/correspondences")
    public ResponseEntity<?> createCorrespondence(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", correspondenceIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        body.putIfAbsent("status", "draft");
        correspondences.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/correspondences/{id}")
    public ResponseEntity<?> updateCorrespondence(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        for (Map<String, Object> c : correspondences) {
            if (c.get("id") != null && c.get("id").toString().equals(id.toString())) {
                if (body != null) c.putAll(body);
                c.put("id", id);
                return ResponseEntity.ok(c);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/correspondences/{id}")
    public ResponseEntity<?> deleteCorrespondence(@PathVariable Long id) {
        correspondences.removeIf(c -> c.get("id") != null && c.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/correspondences/{id}/send")
    public ResponseEntity<?> sendCorrespondence(@PathVariable Long id) {
        for (Map<String, Object> c : correspondences) {
            if (c.get("id") != null && c.get("id").toString().equals(id.toString())) {
                c.put("status", "sent");
                return ResponseEntity.ok(c);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/correspondences/{id}/status")
    public ResponseEntity<?> updateCorrespondenceStatus(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        for (Map<String, Object> c : correspondences) {
            if (c.get("id") != null && c.get("id").toString().equals(id.toString())) {
                if (body != null && body.get("status") != null) {
                    c.put("status", body.get("status"));
                }
                return ResponseEntity.ok(c);
            }
        }
        return ResponseEntity.notFound().build();
    }

    // ===== Official Communications =====

    @GetMapping("/official")
    public ResponseEntity<?> getOfficialComms() {
        return ResponseEntity.ok(officialComms);
    }

    @PostMapping("/official")
    public ResponseEntity<?> createOfficialComm(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", officialIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        officialComms.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/official/{id}")
    public ResponseEntity<?> updateOfficialComm(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        for (Map<String, Object> o : officialComms) {
            if (o.get("id") != null && o.get("id").toString().equals(id.toString())) {
                if (body != null) o.putAll(body);
                o.put("id", id);
                return ResponseEntity.ok(o);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/official/{id}")
    public ResponseEntity<?> deleteOfficialComm(@PathVariable Long id) {
        officialComms.removeIf(o -> o.get("id") != null && o.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}
