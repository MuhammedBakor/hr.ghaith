package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/v1/blog")
@CrossOrigin(origins = "*")
public class BlogController {

    private static final List<Map<String, Object>> posts = new CopyOnWriteArrayList<>();
    private static final AtomicLong idCounter = new AtomicLong(1);

    @GetMapping("/posts")
    public ResponseEntity<?> getPosts() {
        return ResponseEntity.ok(posts);
    }

    @PostMapping("/posts")
    public ResponseEntity<?> createPost(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", idCounter.getAndIncrement());
        body.putIfAbsent("status", "draft");
        body.putIfAbsent("views", 0);
        body.putIfAbsent("comments", 0);
        body.putIfAbsent("likes", 0);
        body.putIfAbsent("publishDate", new java.util.Date());
        body.putIfAbsent("createdAt", new java.util.Date());
        posts.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/posts/{id}")
    public ResponseEntity<?> updatePost(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> post : posts) {
            if (post.get("id") != null && post.get("id").toString().equals(id.toString())) {
                post.putAll(body);
                post.put("id", id);
                return ResponseEntity.ok(post);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id) {
        posts.removeIf(p -> p.get("id") != null && p.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}
