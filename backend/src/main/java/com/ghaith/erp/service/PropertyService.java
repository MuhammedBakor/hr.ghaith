package com.ghaith.erp.service;

import com.ghaith.erp.model.*;
import com.ghaith.erp.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final PropertyUnitRepository unitRepository;
    private final LeaseRepository leaseRepository;
    private final TenantRepository tenantRepository;
    private final MaintenanceRequestRepository maintenanceRepository;

    // Properties
    public List<Property> getAllProperties() {
        return propertyRepository.findAll();
    }

    public Property createProperty(Property property) {
        return propertyRepository.save(property);
    }

    // Units
    public List<PropertyUnit> getAllUnits() {
        return unitRepository.findAll();
    }

    public List<PropertyUnit> getUnitsByProperty(Long propertyId) {
        return unitRepository.findByPropertyId(propertyId);
    }

    public PropertyUnit createUnit(PropertyUnit unit) {
        return unitRepository.save(unit);
    }

    // Tenants
    public List<Tenant> getAllTenants() {
        return tenantRepository.findAll();
    }

    public Tenant createTenant(Tenant tenant) {
        return tenantRepository.save(tenant);
    }

    // Leases
    public List<Lease> getAllLeases() {
        return leaseRepository.findAll();
    }

    public Lease createLease(Lease lease) {
        return leaseRepository.save(lease);
    }

    // Maintenance
    public List<MaintenanceRequest> getAllMaintenanceRequests() {
        return maintenanceRepository.findAll();
    }

    public MaintenanceRequest createMaintenanceRequest(MaintenanceRequest request) {
        return maintenanceRepository.save(request);
    }
}
