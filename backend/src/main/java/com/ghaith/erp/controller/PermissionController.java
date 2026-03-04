package com.ghaith.erp.controller;

import com.ghaith.erp.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/permissions")
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    @GetMapping("/matrix")
    public ResponseEntity<Map<String, Map<String, Boolean>>> getPermissionMatrix() {
        return ResponseEntity.ok(permissionService.getPermissionMatrix());
    }

    @PostMapping("/matrix")
    public ResponseEntity<Void> updatePermissionMatrix(@RequestBody Map<String, Map<String, Boolean>> matrix) {
        permissionService.updatePermissionMatrix(matrix);
        return ResponseEntity.ok().build();
    }
}
