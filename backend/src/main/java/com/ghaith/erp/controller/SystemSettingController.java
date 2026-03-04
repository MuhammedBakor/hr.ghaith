package com.ghaith.erp.controller;

import com.ghaith.erp.model.SystemSetting;
import com.ghaith.erp.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/settings")
@RequiredArgsConstructor
public class SystemSettingController {

    private final SystemSettingService service;

    @GetMapping
    public ResponseEntity<List<SystemSetting>> getAllSettings() {
        return ResponseEntity.ok(service.getAllSettings());
    }

    @GetMapping("/{key}")
    public ResponseEntity<SystemSetting> getSetting(@PathVariable String key) {
        return service.getSettingByKey(key)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/set")
    public ResponseEntity<SystemSetting> setSetting(@RequestBody Map<String, String> payload) {
        String key = payload.get("key");
        String value = payload.get("value");
        if (key == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(service.updateSetting(key, value));
    }

    @DeleteMapping("/{key}")
    public ResponseEntity<Void> deleteSetting(@PathVariable String key) {
        service.deleteSetting(key);
        return ResponseEntity.noContent().build();
    }
}
