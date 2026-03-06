package com.ghaith.erp.controller;

import com.ghaith.erp.model.*;
import com.ghaith.erp.service.FleetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/fleet")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FleetController {

    private final FleetService fleetService;

    @GetMapping("/vehicles")
    public ResponseEntity<List<Vehicle>> getVehicles() {
        return ResponseEntity.ok(fleetService.getAllVehicles());
    }

    @PostMapping("/vehicles")
    public ResponseEntity<Vehicle> createVehicle(@RequestBody Vehicle vehicle) {
        return ResponseEntity.ok(fleetService.createVehicle(vehicle));
    }

    @GetMapping("/drivers")
    public ResponseEntity<List<Driver>> getDrivers() {
        return ResponseEntity.ok(fleetService.getAllDrivers());
    }

    @PostMapping("/drivers")
    public ResponseEntity<Driver> createDriver(@RequestBody Driver driver) {
        return ResponseEntity.ok(fleetService.createDriver(driver));
    }

    @GetMapping("/maintenance")
    public ResponseEntity<?> getMaintenance() {
        return ResponseEntity.ok(fleetService.getAllFuelLogs());
    }

    @GetMapping("/fuel")
    public ResponseEntity<List<FuelLog>> getFuelLogs() {
        return ResponseEntity.ok(fleetService.getAllFuelLogs());
    }

    @PostMapping("/fuel")
    public ResponseEntity<FuelLog> createFuelLog(@RequestBody FuelLog fuelLog) {
        return ResponseEntity.ok(fleetService.createFuelLog(fuelLog));
    }
}
