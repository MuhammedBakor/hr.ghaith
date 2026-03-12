package com.ghaith.erp.controller;

import com.ghaith.erp.service.UserMigrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/migration")
@RequiredArgsConstructor
public class MigrationController {

    private final UserMigrationService migrationService;

    @PostMapping("/unify-users")
    @PreAuthorize("hasRole('ADMIN') or hasRole('OWNER')")
    public String unifyUsers() {
        return migrationService.unifyDuplicateUsers();
    }
}
