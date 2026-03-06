package com.ghaith.erp.service;

import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FleetService {

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final FuelLogRepository fuelLogRepository;

    // Vehicles
    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    public Vehicle createVehicle(Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    // Drivers
    public List<Driver> getAllDrivers() {
        return driverRepository.findAll();
    }

    public Driver createDriver(Driver driver) {
        return driverRepository.save(driver);
    }

    // Fuel Logs
    public List<FuelLog> getAllFuelLogs() {
        return fuelLogRepository.findAll();
    }

    public FuelLog createFuelLog(FuelLog fuelLog) {
        return fuelLogRepository.save(fuelLog);
    }
}
