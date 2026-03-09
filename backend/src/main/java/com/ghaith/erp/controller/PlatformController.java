package com.ghaith.erp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/v1/platform")
@CrossOrigin(origins = "*")
public class PlatformController {

    private static final List<Map<String, Object>> aiPolicies = new CopyOnWriteArrayList<>();
    private static final AtomicLong aiPolicyIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> alerts = new CopyOnWriteArrayList<>();
    private static final AtomicLong alertIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> calendarEvents = new CopyOnWriteArrayList<>();
    private static final AtomicLong calendarIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> dmsDocuments = new CopyOnWriteArrayList<>();
    private static final AtomicLong dmsIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> notifications = new CopyOnWriteArrayList<>();
    private static final AtomicLong notificationIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> notifyRules = new CopyOnWriteArrayList<>();
    private static final AtomicLong notifyRuleIdCounter = new AtomicLong(1);
    private static final List<Map<String, Object>> upgrades = new CopyOnWriteArrayList<>();
    private static final AtomicLong upgradeIdCounter = new AtomicLong(1);
    private static final Map<String, Object> notifyPreferences = new HashMap<>();

    // ===== AI Policies =====

    @GetMapping("/ai-policies")
    public ResponseEntity<?> getAiPolicies() {
        return ResponseEntity.ok(aiPolicies);
    }

    @PostMapping("/ai-policies")
    public ResponseEntity<?> createAiPolicy(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", aiPolicyIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        aiPolicies.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/ai-policies/{id}")
    public ResponseEntity<?> updateAiPolicy(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        for (Map<String, Object> policy : aiPolicies) {
            if (policy.get("id") != null && policy.get("id").toString().equals(id.toString())) {
                if (body != null) policy.putAll(body);
                policy.put("id", id);
                return ResponseEntity.ok(policy);
            }
        }
        return ResponseEntity.notFound().build();
    }

    // ===== Alerts =====

    @GetMapping("/alerts")
    public ResponseEntity<?> getAlerts() {
        return ResponseEntity.ok(alerts);
    }

    @PostMapping("/alerts")
    public ResponseEntity<?> createAlert(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", alertIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        alerts.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/alerts/{id}/read")
    public ResponseEntity<?> markAlertAsRead(@PathVariable Long id) {
        for (Map<String, Object> alert : alerts) {
            if (alert.get("id") != null && alert.get("id").toString().equals(id.toString())) {
                alert.put("read", true);
            }
        }
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Calendar =====

    @GetMapping("/calendar")
    public ResponseEntity<?> getCalendarEvents() {
        return ResponseEntity.ok(calendarEvents);
    }

    @PostMapping("/calendar")
    public ResponseEntity<?> createCalendarEvent(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", calendarIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        calendarEvents.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/calendar/{id}")
    public ResponseEntity<?> updateCalendarEvent(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        for (Map<String, Object> event : calendarEvents) {
            if (event.get("id") != null && event.get("id").toString().equals(id.toString())) {
                if (body != null) event.putAll(body);
                event.put("id", id);
                return ResponseEntity.ok(event);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/calendar/{id}")
    public ResponseEntity<?> deleteCalendarEvent(@PathVariable Long id) {
        calendarEvents.removeIf(event -> event.get("id") != null && event.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== DMS =====

    @GetMapping("/dms")
    public ResponseEntity<?> getDmsDocuments() {
        return ResponseEntity.ok(dmsDocuments);
    }

    @PostMapping("/dms")
    public ResponseEntity<?> createDmsDocument(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", dmsIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        dmsDocuments.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/dms/{id}")
    public ResponseEntity<?> updateDmsDocument(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        for (Map<String, Object> doc : dmsDocuments) {
            if (doc.get("id") != null && doc.get("id").toString().equals(id.toString())) {
                if (body != null) doc.putAll(body);
                doc.put("id", id);
                return ResponseEntity.ok(doc);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/dms/{id}")
    public ResponseEntity<?> deleteDmsDocument(@PathVariable Long id) {
        dmsDocuments.removeIf(doc -> doc.get("id") != null && doc.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Inbox =====

    private static final List<Map<String, Object>> inboxItems = new CopyOnWriteArrayList<>();
    private static final AtomicLong inboxIdCounter = new AtomicLong(1);

    @GetMapping("/inbox")
    public ResponseEntity<?> getInbox() {
        return ResponseEntity.ok(inboxItems);
    }

    @GetMapping("/inbox/stats")
    public ResponseEntity<?> getInboxStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", inboxItems.size());
        stats.put("unread", inboxItems.stream().filter(i -> !Boolean.TRUE.equals(i.get("read"))).count());
        return ResponseEntity.ok(stats);
    }

    @PutMapping("/inbox/{id}")
    public ResponseEntity<?> updateInboxItem(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        for (Map<String, Object> item : inboxItems) {
            if (item.get("id") != null && item.get("id").toString().equals(id.toString())) {
                if (body != null) item.putAll(body);
                item.put("id", id);
                return ResponseEntity.ok(item);
            }
        }
        return ResponseEntity.notFound().build();
    }

    // ===== Monitoring =====

    @GetMapping("/monitoring")
    public ResponseEntity<?> getMonitoring() {
        Map<String, Object> monitoring = new HashMap<>();
        monitoring.put("cpu", 25);
        monitoring.put("memory", 40);
        monitoring.put("disk", 55);
        monitoring.put("uptime", "99.9%");
        monitoring.put("status", "healthy");
        return ResponseEntity.ok(monitoring);
    }

    @GetMapping("/monitoring/metrics")
    public ResponseEntity<?> getMonitoringMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("cpu", 25);
        metrics.put("memory", 40);
        metrics.put("disk", 55);
        metrics.put("uptime", "99.9%");
        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/monitoring/ready")
    public ResponseEntity<?> getMonitoringReady() {
        Map<String, Object> response = new HashMap<>();
        response.put("ready", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/monitoring/status")
    public ResponseEntity<?> getMonitoringStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("services", Collections.emptyList());
        return ResponseEntity.ok(response);
    }

    // ===== Search =====

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam(required = false) String query) {
        return ResponseEntity.ok(Collections.emptyList());
    }

    // ===== Notifications =====

    @GetMapping("/notifications")
    public ResponseEntity<?> getNotifications() {
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<?> getUnreadCount() {
        long unread = notifications.stream().filter(n -> !Boolean.TRUE.equals(n.get("read"))).count();
        Map<String, Object> response = new HashMap<>();
        response.put("count", unread);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/notifications")
    public ResponseEntity<?> updateNotification(@RequestBody(required = false) Map<String, Object> body) {
        if (body != null && body.get("id") != null) {
            for (Map<String, Object> n : notifications) {
                if (n.get("id") != null && n.get("id").toString().equals(body.get("id").toString())) {
                    n.putAll(body);
                    return ResponseEntity.ok(n);
                }
            }
        }
        return ResponseEntity.ok(body != null ? body : new HashMap<>());
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<?> markNotificationAsRead(@PathVariable Long id) {
        for (Map<String, Object> n : notifications) {
            if (n.get("id") != null && n.get("id").toString().equals(id.toString())) {
                n.put("read", true);
            }
        }
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/notifications/read-all")
    public ResponseEntity<?> markAllNotificationsAsRead() {
        for (Map<String, Object> n : notifications) {
            n.put("read", true);
        }
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Notify Preferences =====

    @GetMapping("/notify-preferences")
    public ResponseEntity<?> getNotifyPreferences() {
        return ResponseEntity.ok(notifyPreferences);
    }

    @PutMapping("/notify-preferences")
    public ResponseEntity<?> updateNotifyPreferences(@RequestBody(required = false) Map<String, Object> body) {
        if (body != null) notifyPreferences.putAll(body);
        return ResponseEntity.ok(notifyPreferences);
    }

    @PutMapping("/notify-preferences/all")
    public ResponseEntity<?> updateAllNotifyPreferences(@RequestBody(required = false) Map<String, Object> body) {
        if (body != null) notifyPreferences.putAll(body);
        return ResponseEntity.ok(notifyPreferences);
    }

    @PostMapping("/notify-preferences/reset")
    public ResponseEntity<?> resetNotifyPreferences() {
        notifyPreferences.clear();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Notify Rules =====

    @GetMapping("/notify-rules")
    public ResponseEntity<?> getNotifyRules() {
        return ResponseEntity.ok(notifyRules);
    }

    @PostMapping("/notify-rules")
    public ResponseEntity<?> createNotifyRule(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", notifyRuleIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        notifyRules.add(body);
        return ResponseEntity.ok(body);
    }

    @PutMapping("/notify-rules/{id}")
    public ResponseEntity<?> updateNotifyRule(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        for (Map<String, Object> rule : notifyRules) {
            if (rule.get("id") != null && rule.get("id").toString().equals(id.toString())) {
                if (body != null) rule.putAll(body);
                rule.put("id", id);
                return ResponseEntity.ok(rule);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/notify-rules/{id}")
    public ResponseEntity<?> deleteNotifyRule(@PathVariable Long id) {
        notifyRules.removeIf(rule -> rule.get("id") != null && rule.get("id").toString().equals(id.toString()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    // ===== Upgrades =====

    @GetMapping("/upgrades")
    public ResponseEntity<?> getUpgrades() {
        return ResponseEntity.ok(upgrades);
    }

    @GetMapping("/upgrades/check")
    public ResponseEntity<?> checkUpgrades() {
        Map<String, Object> response = new HashMap<>();
        response.put("available", false);
        response.put("currentVersion", "1.0.0");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/upgrades/health")
    public ResponseEntity<?> getUpgradesHealth() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "healthy");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/upgrades/history")
    public ResponseEntity<?> getUpgradesHistory() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/upgrades")
    public ResponseEntity<?> createUpgrade(@RequestBody(required = false) Map<String, Object> body) {
        if (body == null) body = new HashMap<>();
        body.put("id", upgradeIdCounter.getAndIncrement());
        body.putIfAbsent("createdAt", new java.util.Date());
        upgrades.add(body);
        return ResponseEntity.ok(body);
    }

    @PostMapping("/upgrades/{id}/install")
    public ResponseEntity<?> installUpgrade(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}
