package com.ghaith.erp.controller;

import com.ghaith.erp.model.*;
import com.ghaith.erp.service.FleetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/api/v1/fleet")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FleetController {

    private final FleetService fleetService;

    // In-memory storage for trips, dispatch, incidents, alerts
    private static final CopyOnWriteArrayList<Map<String, Object>> trips = new CopyOnWriteArrayList<>();
    private static final CopyOnWriteArrayList<Map<String, Object>> dispatch = new CopyOnWriteArrayList<>();
    private static final CopyOnWriteArrayList<Map<String, Object>> incidents = new CopyOnWriteArrayList<>();
    private static final AtomicLong tripIdCounter = new AtomicLong(1);
    private static final AtomicLong dispatchIdCounter = new AtomicLong(1);
    private static final AtomicLong incidentIdCounter = new AtomicLong(1);
    private static final AtomicLong maintenanceIdCounter = new AtomicLong(1);

    // ==================== Vehicles ====================

    @GetMapping("/vehicles")
    public ResponseEntity<List<Vehicle>> getVehicles() {
        return ResponseEntity.ok(fleetService.getAllVehicles());
    }

    @PostMapping("/vehicles")
    public ResponseEntity<Vehicle> createVehicle(@RequestBody Vehicle vehicle) {
        return ResponseEntity.ok(fleetService.createVehicle(vehicle));
    }

    @PutMapping("/vehicles/{id}")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable Long id, @RequestBody Vehicle vehicle) {
        vehicle.setId(id);
        return ResponseEntity.ok(fleetService.createVehicle(vehicle));
    }

    @DeleteMapping("/vehicles/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        List<Vehicle> vehicles = fleetService.getAllVehicles();
        vehicles.removeIf(v -> v.getId().equals(id));
        return ResponseEntity.ok().build();
    }

    // ==================== Drivers ====================

    @GetMapping("/drivers")
    public ResponseEntity<List<Driver>> getDrivers() {
        return ResponseEntity.ok(fleetService.getAllDrivers());
    }

    @PostMapping("/drivers")
    public ResponseEntity<Driver> createDriver(@RequestBody Driver driver) {
        return ResponseEntity.ok(fleetService.createDriver(driver));
    }

    @PutMapping("/drivers/{id}")
    public ResponseEntity<Driver> updateDriver(@PathVariable Long id, @RequestBody Driver driver) {
        driver.setId(id);
        return ResponseEntity.ok(fleetService.createDriver(driver));
    }

    @DeleteMapping("/drivers/{id}")
    public ResponseEntity<Void> deleteDriver(@PathVariable Long id) {
        List<Driver> drivers = fleetService.getAllDrivers();
        drivers.removeIf(d -> d.getId().equals(id));
        return ResponseEntity.ok().build();
    }

    // ==================== Maintenance ====================

    @GetMapping("/maintenance")
    public ResponseEntity<?> getMaintenance() {
        return ResponseEntity.ok(fleetService.getAllFuelLogs());
    }

    @PostMapping("/maintenance")
    public ResponseEntity<Map<String, Object>> createMaintenance(@RequestBody Map<String, Object> maintenance) {
        maintenance.put("id", maintenanceIdCounter.getAndIncrement());
        return ResponseEntity.ok(maintenance);
    }

    @PutMapping("/maintenance/{id}")
    public ResponseEntity<Map<String, Object>> updateMaintenance(@PathVariable Long id, @RequestBody Map<String, Object> maintenance) {
        maintenance.put("id", id);
        return ResponseEntity.ok(maintenance);
    }

    @DeleteMapping("/maintenance/{id}")
    public ResponseEntity<Void> deleteMaintenance(@PathVariable Long id) {
        return ResponseEntity.ok().build();
    }

    // ==================== Fuel ====================

    @GetMapping("/fuel")
    public ResponseEntity<List<FuelLog>> getFuelLogs() {
        return ResponseEntity.ok(fleetService.getAllFuelLogs());
    }

    @PostMapping("/fuel")
    public ResponseEntity<FuelLog> createFuelLog(@RequestBody FuelLog fuelLog) {
        return ResponseEntity.ok(fleetService.createFuelLog(fuelLog));
    }

    @PutMapping("/fuel/{id}")
    public ResponseEntity<FuelLog> updateFuelLog(@PathVariable Long id, @RequestBody FuelLog fuelLog) {
        fuelLog.setId(id);
        return ResponseEntity.ok(fleetService.createFuelLog(fuelLog));
    }

    @DeleteMapping("/fuel/{id}")
    public ResponseEntity<Void> deleteFuelLog(@PathVariable Long id) {
        return ResponseEntity.ok().build();
    }

    // ==================== Trips ====================

    @GetMapping("/trips")
    public ResponseEntity<List<Map<String, Object>>> getTrips() {
        return ResponseEntity.ok(new ArrayList<>(trips));
    }

    @PostMapping("/trips")
    public ResponseEntity<Map<String, Object>> createTrip(@RequestBody Map<String, Object> trip) {
        trip.put("id", tripIdCounter.getAndIncrement());
        trips.add(trip);
        return ResponseEntity.ok(trip);
    }

    // ==================== Daily Reports & Routes ====================

    @GetMapping("/daily-reports")
    public ResponseEntity<List<Object>> getDailyReports() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/daily-routes")
    public ResponseEntity<List<Object>> getDailyRoutes() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    // ==================== Dispatch ====================

    @GetMapping("/dispatch")
    public ResponseEntity<List<Map<String, Object>>> getDispatch() {
        return ResponseEntity.ok(new ArrayList<>(dispatch));
    }

    @PostMapping("/dispatch")
    public ResponseEntity<Map<String, Object>> createDispatch(@RequestBody Map<String, Object> dispatchItem) {
        dispatchItem.put("id", dispatchIdCounter.getAndIncrement());
        dispatch.add(dispatchItem);
        return ResponseEntity.ok(dispatchItem);
    }

    @PutMapping("/dispatch/{id}")
    public ResponseEntity<Map<String, Object>> updateDispatch(@PathVariable Long id, @RequestBody Map<String, Object> dispatchItem) {
        dispatchItem.put("id", id);
        dispatch.removeIf(d -> Long.valueOf(d.get("id").toString()).equals(id));
        dispatch.add(dispatchItem);
        return ResponseEntity.ok(dispatchItem);
    }

    // ==================== Incidents ====================

    @GetMapping("/incidents")
    public ResponseEntity<List<Map<String, Object>>> getIncidents() {
        return ResponseEntity.ok(new ArrayList<>(incidents));
    }

    @PostMapping("/incidents")
    public ResponseEntity<Map<String, Object>> createIncident(@RequestBody Map<String, Object> incident) {
        incident.put("id", incidentIdCounter.getAndIncrement());
        incidents.add(incident);
        return ResponseEntity.ok(incident);
    }

    @PutMapping("/incidents/{id}")
    public ResponseEntity<Map<String, Object>> updateIncident(@PathVariable Long id, @RequestBody Map<String, Object> incident) {
        incident.put("id", id);
        incidents.removeIf(i -> Long.valueOf(i.get("id").toString()).equals(id));
        incidents.add(incident);
        return ResponseEntity.ok(incident);
    }

    // ==================== Alerts ====================

    @GetMapping("/alerts")
    public ResponseEntity<List<Object>> getAlerts() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    // ==================== Automation ====================

    @GetMapping("/automation/services")
    public ResponseEntity<List<Object>> getAutomationServices() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @PostMapping("/automation/toggle")
    public ResponseEntity<Map<String, Object>> toggleAutomation(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/automation/run")
    public ResponseEntity<Map<String, Object>> runAutomation(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }
}
