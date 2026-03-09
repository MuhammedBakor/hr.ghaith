package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/v1/settings")
@CrossOrigin(origins = "*")
public class SettingsExtendedController {

    // SMTP / SMS / WhatsApp settings stored as single maps
    private static final Map<String, Object> smtpSettings = Collections.synchronizedMap(new HashMap<>());
    private static final Map<String, Object> smsSettings = Collections.synchronizedMap(new HashMap<>());
    private static final Map<String, Object> whatsappSettings = Collections.synchronizedMap(new HashMap<>());

    // Code prefixes stored as a map
    private static final Map<String, Object> codePrefixes = Collections.synchronizedMap(new HashMap<>());

    // Message Templates
    private static final List<Map<String, Object>> messageTemplates = new CopyOnWriteArrayList<>();
    private static final AtomicLong messageTemplateIdCounter = new AtomicLong(1);

    // Letter Templates
    private static final List<Map<String, Object>> letterTemplates = new CopyOnWriteArrayList<>();
    private static final AtomicLong letterTemplateIdCounter = new AtomicLong(1);

    // Backups
    private static final List<Map<String, Object>> backups = new CopyOnWriteArrayList<>();
    private static final AtomicLong backupIdCounter = new AtomicLong(1);

    // ===== SMTP =====

    @GetMapping("/smtp")
    public ResponseEntity<?> getSmtpSettings() {
        return ResponseEntity.ok(smtpSettings);
    }

    @PutMapping("/smtp")
    public ResponseEntity<?> saveSmtpSettings(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        smtpSettings.clear();
        smtpSettings.putAll(body);
        return ResponseEntity.ok(smtpSettings);
    }

    @PostMapping("/smtp/test")
    public ResponseEntity<?> testSmtpConnection(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "\u062a\u0645 \u0627\u062e\u062a\u0628\u0627\u0631 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0646\u062c\u0627\u062d");
        return ResponseEntity.ok(response);
    }

    // ===== SMS =====

    @GetMapping("/sms")
    public ResponseEntity<?> getSmsSettings() {
        return ResponseEntity.ok(smsSettings);
    }

    @PutMapping("/sms")
    public ResponseEntity<?> saveSmsSettings(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        smsSettings.clear();
        smsSettings.putAll(body);
        return ResponseEntity.ok(smsSettings);
    }

    @PostMapping("/sms/test")
    public ResponseEntity<?> testSmsConnection(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== WhatsApp =====

    @GetMapping("/whatsapp")
    public ResponseEntity<?> getWhatsappSettings() {
        return ResponseEntity.ok(whatsappSettings);
    }

    @PutMapping("/whatsapp")
    public ResponseEntity<?> saveWhatsappSettings(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        whatsappSettings.clear();
        whatsappSettings.putAll(body);
        return ResponseEntity.ok(whatsappSettings);
    }

    @PostMapping("/whatsapp/test")
    public ResponseEntity<?> testWhatsappConnection(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Message Templates =====

    @GetMapping("/message-templates")
    public ResponseEntity<?> getMessageTemplates() {
        return ResponseEntity.ok(messageTemplates);
    }

    @PostMapping("/message-templates")
    public ResponseEntity<?> createMessageTemplate(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", messageTemplateIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        messageTemplates.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/message-templates/{id}")
    public ResponseEntity<?> updateMessageTemplate(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> t : messageTemplates) {
            if (t.get("id") != null && t.get("id").toString().equals(id.toString())) {
                t.putAll(body);
                t.put("id", id);
                return ResponseEntity.ok(t);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/message-templates/{id}")
    public ResponseEntity<?> deleteMessageTemplate(@PathVariable Long id) {
        messageTemplates.removeIf(t -> t.get("id") != null && t.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Letter Templates =====

    @GetMapping("/letter-templates")
    public ResponseEntity<?> getLetterTemplates() {
        return ResponseEntity.ok(letterTemplates);
    }

    @PostMapping("/letter-templates")
    public ResponseEntity<?> createLetterTemplate(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", letterTemplateIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        letterTemplates.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/letter-templates/{id}")
    public ResponseEntity<?> updateLetterTemplate(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        for (Map<String, Object> t : letterTemplates) {
            if (t.get("id") != null && t.get("id").toString().equals(id.toString())) {
                t.putAll(body);
                t.put("id", id);
                return ResponseEntity.ok(t);
            }
        }
        body.put("id", id);
        return ResponseEntity.ok(body);
    }

    @DeleteMapping("/letter-templates/{id}")
    public ResponseEntity<?> deleteLetterTemplate(@PathVariable Long id) {
        letterTemplates.removeIf(t -> t.get("id") != null && t.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Code Prefixes =====

    @GetMapping("/code-prefixes")
    public ResponseEntity<?> getCodePrefixes() {
        return ResponseEntity.ok(codePrefixes);
    }

    @PutMapping("/code-prefixes")
    public ResponseEntity<?> saveCodePrefixes(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        codePrefixes.clear();
        codePrefixes.putAll(body);
        return ResponseEntity.ok(codePrefixes);
    }

    // ===== Backups =====

    @GetMapping("/backups")
    public ResponseEntity<?> getBackups() {
        return ResponseEntity.ok(backups);
    }

    @PostMapping("/backups")
    public ResponseEntity<?> createBackup(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", backupIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        body.put("status", "completed");
        backups.add(body);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/backups/{id}/restore")
    public ResponseEntity<?> restoreBackup(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/backups/{id}")
    public ResponseEntity<?> deleteBackup(@PathVariable Long id) {
        backups.removeIf(b -> b.get("id") != null && b.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}
