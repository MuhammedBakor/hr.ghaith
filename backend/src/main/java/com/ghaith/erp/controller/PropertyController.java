package com.ghaith.erp.controller;

import com.ghaith.erp.model.*;
import com.ghaith.erp.service.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/v1/property")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PropertyController {

    private final PropertyService propertyService;

    // In-memory storage for contracts
    private static final CopyOnWriteArrayList<Map<String, Object>> contracts = new CopyOnWriteArrayList<>();
    private static final AtomicLong contractIdCounter = new AtomicLong(1);

    // ==================== Properties ====================

    @GetMapping("/properties")
    public ResponseEntity<List<Property>> getAllProperties() {
        return ResponseEntity.ok(propertyService.getAllProperties());
    }

    @PostMapping("/properties")
    public ResponseEntity<Property> createProperty(@RequestBody Property property) {
        return ResponseEntity.ok(propertyService.createProperty(property));
    }

    @PutMapping("/properties/{id}")
    public ResponseEntity<Property> updateProperty(@PathVariable Long id, @RequestBody Property property) {
        property.setId(id);
        return ResponseEntity.ok(propertyService.createProperty(property));
    }

    @DeleteMapping("/properties/{id}")
    public ResponseEntity<Void> deleteProperty(@PathVariable Long id) {
        List<Property> properties = propertyService.getAllProperties();
        properties.removeIf(p -> p.getId().equals(id));
        return ResponseEntity.ok().build();
    }

    // ==================== Units ====================

    @GetMapping("/units")
    public ResponseEntity<List<PropertyUnit>> getAllUnits() {
        return ResponseEntity.ok(propertyService.getAllUnits());
    }

    @PostMapping("/units")
    public ResponseEntity<PropertyUnit> createUnit(@RequestBody PropertyUnit unit) {
        return ResponseEntity.ok(propertyService.createUnit(unit));
    }

    // ==================== Tenants ====================

    @GetMapping("/tenants")
    public ResponseEntity<List<Tenant>> getAllTenants() {
        return ResponseEntity.ok(propertyService.getAllTenants());
    }

    @PostMapping("/tenants")
    public ResponseEntity<Tenant> createTenant(@RequestBody Tenant tenant) {
        return ResponseEntity.ok(propertyService.createTenant(tenant));
    }

    @PutMapping("/tenants/{id}")
    public ResponseEntity<Tenant> updateTenant(@PathVariable Long id, @RequestBody Tenant tenant) {
        tenant.setId(id);
        return ResponseEntity.ok(propertyService.createTenant(tenant));
    }

    @DeleteMapping("/tenants/{id}")
    public ResponseEntity<Void> deleteTenant(@PathVariable Long id) {
        List<Tenant> tenants = propertyService.getAllTenants();
        tenants.removeIf(t -> t.getId().equals(id));
        return ResponseEntity.ok().build();
    }

    // ==================== Leases ====================

    @GetMapping("/leases")
    public ResponseEntity<List<Lease>> getAllLeases() {
        return ResponseEntity.ok(propertyService.getAllLeases());
    }

    @PostMapping("/leases")
    public ResponseEntity<Lease> createLease(@RequestBody Lease lease) {
        return ResponseEntity.ok(propertyService.createLease(lease));
    }

    @PutMapping("/leases/{id}")
    public ResponseEntity<Lease> updateLease(@PathVariable Long id, @RequestBody Lease lease) {
        lease.setId(id);
        return ResponseEntity.ok(propertyService.createLease(lease));
    }

    @DeleteMapping("/leases/{id}")
    public ResponseEntity<Void> deleteLease(@PathVariable Long id) {
        List<Lease> leases = propertyService.getAllLeases();
        leases.removeIf(l -> l.getId().equals(id));
        return ResponseEntity.ok().build();
    }

    // ==================== Contracts (in-memory) ====================

    @GetMapping("/contracts")
    public ResponseEntity<List<Map<String, Object>>> getAllContracts() {
        return ResponseEntity.ok(new ArrayList<>(contracts));
    }

    @PostMapping("/contracts")
    public ResponseEntity<Map<String, Object>> createContract(@RequestBody Map<String, Object> contract) {
        contract.put("id", contractIdCounter.getAndIncrement());
        contracts.add(contract);
        return ResponseEntity.ok(contract);
    }

    @PutMapping("/contracts/{id}")
    public ResponseEntity<Map<String, Object>> updateContract(@PathVariable Long id, @RequestBody Map<String, Object> contract) {
        contract.put("id", id);
        contracts.removeIf(c -> Long.valueOf(c.get("id").toString()).equals(id));
        contracts.add(contract);
        return ResponseEntity.ok(contract);
    }

    @DeleteMapping("/contracts/{id}")
    public ResponseEntity<Void> deleteContract(@PathVariable Long id) {
        contracts.removeIf(c -> Long.valueOf(c.get("id").toString()).equals(id));
        return ResponseEntity.ok().build();
    }

    // ==================== Maintenance ====================

    @GetMapping("/maintenance")
    public ResponseEntity<List<MaintenanceRequest>> getAllMaintenance() {
        return ResponseEntity.ok(propertyService.getAllMaintenanceRequests());
    }

    @PostMapping("/maintenance")
    public ResponseEntity<MaintenanceRequest> createMaintenance(@RequestBody MaintenanceRequest request) {
        return ResponseEntity.ok(propertyService.createMaintenanceRequest(request));
    }

    @PutMapping("/maintenance/{id}")
    public ResponseEntity<MaintenanceRequest> updateMaintenance(@PathVariable Long id, @RequestBody MaintenanceRequest request) {
        request.setId(id);
        return ResponseEntity.ok(propertyService.createMaintenanceRequest(request));
    }

    @DeleteMapping("/maintenance/{id}")
    public ResponseEntity<Void> deleteMaintenance(@PathVariable Long id) {
        List<MaintenanceRequest> maintenance = propertyService.getAllMaintenanceRequests();
        maintenance.removeIf(m -> m.getId().equals(id));
        return ResponseEntity.ok().build();
    }
}
