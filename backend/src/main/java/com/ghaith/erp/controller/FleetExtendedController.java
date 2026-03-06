package com.ghaith.erp.controller;

import com.ghaith.erp.model.*;
import com.ghaith.erp.service.FleetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/fleet-extended")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FleetExtendedController {

    private final FleetService fleetService;

    @GetMapping("/drivers")
    public ResponseEntity<List<Driver>> getDrivers() {
        return ResponseEntity.ok(fleetService.getAllDrivers());
    }

    @GetMapping("/fuel-logs")
    public ResponseEntity<List<FuelLog>> getFuelLogs() {
        return ResponseEntity.ok(fleetService.getAllFuelLogs());
    }

    @PostMapping("/fuel-logs")
    public ResponseEntity<FuelLog> createFuelLog(@RequestBody FuelLog fuelLog) {
        return ResponseEntity.ok(fleetService.createFuelLog(fuelLog));
    }
}
