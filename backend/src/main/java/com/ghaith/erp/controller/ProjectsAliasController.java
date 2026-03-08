package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/v1/projects")
@CrossOrigin(origins = "*")
public class ProjectsAliasController {

    private static final List<Map<String, Object>> projects = new CopyOnWriteArrayList<>();
    private static final AtomicLong projectIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> tasks = new CopyOnWriteArrayList<>();
    private static final AtomicLong taskIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> members = new CopyOnWriteArrayList<>();
    private static final AtomicLong memberIdCounter = new AtomicLong(1);

    @GetMapping("")
    public ResponseEntity<?> getProjects() {
        return ResponseEntity.ok(projects);
    }

    @PostMapping("")
    public ResponseEntity<?> createProject(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", projectIdCounter.getAndIncrement());
        body.putIfAbsent("status", "active");
        body.putIfAbsent("createdAt", new java.util.Date());
        projects.add(body);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/tasks")
    public ResponseEntity<?> getTasks(@RequestParam(required = false) Long projectId) {
        if (projectId != null) {
            List<Map<String, Object>> filtered = new ArrayList<>();
            for (Map<String, Object> t : tasks) {
                if (t.get("projectId") != null && t.get("projectId").toString().equals(projectId.toString())) {
                    filtered.add(t);
                }
            }
            return ResponseEntity.ok(filtered);
        }
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

    @GetMapping("/members")
    public ResponseEntity<?> getMembers(@RequestParam(required = false) Long projectId) {
        if (projectId != null) {
            List<Map<String, Object>> filtered = new ArrayList<>();
            for (Map<String, Object> m : members) {
                if (m.get("projectId") != null && m.get("projectId").toString().equals(projectId.toString())) {
                    filtered.add(m);
                }
            }
            return ResponseEntity.ok(filtered);
        }
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
}
