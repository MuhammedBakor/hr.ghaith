package com.ghaith.erp.controller;

import com.ghaith.erp.model.*;
import com.ghaith.erp.service.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/property")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PropertyController {

    private final PropertyService propertyService;

    @GetMapping("/properties")
    public ResponseEntity<List<Property>> getAllProperties() {
        return ResponseEntity.ok(propertyService.getAllProperties());
    }

    @PostMapping("/properties")
    public ResponseEntity<Property> createProperty(@RequestBody Property property) {
        return ResponseEntity.ok(propertyService.createProperty(property));
    }

    @GetMapping("/units")
    public ResponseEntity<List<PropertyUnit>> getAllUnits() {
        return ResponseEntity.ok(propertyService.getAllUnits());
    }

    @PostMapping("/units")
    public ResponseEntity<PropertyUnit> createUnit(@RequestBody PropertyUnit unit) {
        return ResponseEntity.ok(propertyService.createUnit(unit));
    }

    @GetMapping("/tenants")
    public ResponseEntity<List<Tenant>> getAllTenants() {
        return ResponseEntity.ok(propertyService.getAllTenants());
    }

    @PostMapping("/tenants")
    public ResponseEntity<Tenant> createTenant(@RequestBody Tenant tenant) {
        return ResponseEntity.ok(propertyService.createTenant(tenant));
    }

    @GetMapping("/leases")
    public ResponseEntity<List<Lease>> getAllLeases() {
        return ResponseEntity.ok(propertyService.getAllLeases());
    }

    @PostMapping("/leases")
    public ResponseEntity<Lease> createLease(@RequestBody Lease lease) {
        return ResponseEntity.ok(propertyService.createLease(lease));
    }

    @GetMapping("/maintenance")
    public ResponseEntity<List<MaintenanceRequest>> getAllMaintenance() {
        return ResponseEntity.ok(propertyService.getAllMaintenanceRequests());
    }

    @PostMapping("/maintenance")
    public ResponseEntity<MaintenanceRequest> createMaintenance(@RequestBody MaintenanceRequest request) {
        return ResponseEntity.ok(propertyService.createMaintenanceRequest(request));
    }
}
