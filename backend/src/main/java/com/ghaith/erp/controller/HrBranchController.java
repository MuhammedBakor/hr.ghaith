package com.ghaith.erp.controller;

import com.ghaith.erp.model.HrBranch;
import com.ghaith.erp.service.HrBranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/hr/branches")
@RequiredArgsConstructor
public class HrBranchController {
    private final HrBranchService hrBranchService;

    @GetMapping
    public List<HrBranch> getAllBranches(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.ghaith.erp.model.User user) {
        if (user != null) {
            var role = user.getRole().name().toLowerCase();
            boolean isAdminOrGM = role.equals("owner") || role.equals("admin") || role.equals("system_admin")
                    || role.equals("general_manager");
            if (!isAdminOrGM) {
                return hrBranchService.getUserBranches(user.getId());
            }
        }
        return hrBranchService.getAllBranches();
    }

    @GetMapping("/{id}")
    public ResponseEntity<HrBranch> getBranchById(@PathVariable Long id) {
        HrBranch branch = hrBranchService.getBranchById(id);
        return branch != null ? ResponseEntity.ok(branch) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public HrBranch createBranch(@RequestBody HrBranch branch) {
        return hrBranchService.createBranch(branch);
    }

    @PutMapping("/{id}")
    public ResponseEntity<HrBranch> updateBranch(@PathVariable Long id, @RequestBody HrBranch branch) {
        HrBranch updatedBranch = hrBranchService.updateBranch(id, branch);
        return updatedBranch != null ? ResponseEntity.ok(updatedBranch) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBranch(@PathVariable Long id) {
        hrBranchService.deleteBranch(id);
        return ResponseEntity.noContent().build();
    }
}
