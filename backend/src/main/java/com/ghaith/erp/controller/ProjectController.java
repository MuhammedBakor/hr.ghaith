package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/v1/operations")
@CrossOrigin(origins = "*")
public class ProjectController {

    private static final List<Map<String, Object>> projects = new CopyOnWriteArrayList<>();
    private static final AtomicLong projectIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> tasks = new CopyOnWriteArrayList<>();
    private static final AtomicLong taskIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> members = new CopyOnWriteArrayList<>();
    private static final AtomicLong memberIdCounter = new AtomicLong(1);

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalProjects", projects.size());
        stats.put("totalTasks", tasks.size());
        stats.put("totalMembers", members.size());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("")
    public ResponseEntity<?> getOperations() {
        return ResponseEntity.ok(projects);
    }

    @GetMapping("/projects")
    public ResponseEntity<?> getProjects() {
        return ResponseEntity.ok(projects);
    }

    @PostMapping("/projects")
    public ResponseEntity<?> createProject(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", projectIdCounter.getAndIncrement());
        body.putIfAbsent("status", "active");
        body.putIfAbsent("createdAt", new java.util.Date());
        projects.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/projects")
    public ResponseEntity<?> updateProject(@RequestBody(required = false) Map<String, Object> body) {
        if (body != null && body.get("id") != null) {
            for (Map<String, Object> p : projects) {
                if (p.get("id") != null && p.get("id").toString().equals(body.get("id").toString())) {
                    p.putAll(body);
                    return ResponseEntity.ok(p);
                }
            }
        }
        return ResponseEntity.ok(body != null ? body : new HashMap<>());
    }

    @PutMapping("/projects/{id}")
    public ResponseEntity<?> updateProjectById(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> p : projects) {
            if (p.get("id") != null && p.get("id").toString().equals(id.toString())) {
                p.putAll(body);
                p.put("id", id);
                return ResponseEntity.ok(p);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/projects")
    public ResponseEntity<?> deleteProject(@RequestBody(required = false) Map<String, Object> body) {
        if (body != null && body.get("id") != null) {
            projects.removeIf(p -> p.get("id") != null && p.get("id").toString().equals(body.get("id").toString()));
        }
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/projects/{id}")
    public ResponseEntity<?> deleteProjectById(@PathVariable Long id) {
        projects.removeIf(p -> p.get("id") != null && p.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/members")
    public ResponseEntity<?> getMembers() {
        return ResponseEntity.ok(members);
    }

    @PostMapping("/members")
    public ResponseEntity<?> createMember(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", memberIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        members.add(body);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/members/{id}")
    public ResponseEntity<?> deleteMember(@PathVariable Long id) {
        members.removeIf(m -> m.get("id") != null && m.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/tasks")
    public ResponseEntity<?> getTasks() {
        return ResponseEntity.ok(tasks);
    }

    @PostMapping("/tasks")
    public ResponseEntity<?> createTask(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", taskIdCounter.getAndIncrement());
        body.putIfAbsent("status", "open");
        body.putIfAbsent("createdAt", new java.util.Date());
        tasks.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/tasks/{id}")
    public ResponseEntity<?> updateTask(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> t : tasks) {
            if (t.get("id") != null && t.get("id").toString().equals(id.toString())) {
                t.putAll(body);
                t.put("id", id);
                return ResponseEntity.ok(t);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        tasks.removeIf(t -> t.get("id") != null && t.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}
