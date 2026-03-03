package com.ghaith.erp.service;

import com.ghaith.erp.model.BiDashboard;
import com.ghaith.erp.repository.BiDashboardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BiService {

    private final BiDashboardRepository dashboardRepository;

    public List<BiDashboard> getAllDashboards() {
        return dashboardRepository.findAll();
    }

    public List<BiDashboard> getDashboardsByOwner(Long ownerId) {
        return dashboardRepository.findByOwnerId(ownerId);
    }

    public BiDashboard getDashboardById(Long id) {
        return dashboardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("لوحة البيانات غير موجودة"));
    }

    @Transactional
    public BiDashboard createDashboard(BiDashboard dashboard) {
        return dashboardRepository.save(dashboard);
    }

    @Transactional
    public BiDashboard updateDashboard(Long id, BiDashboard dashboardDetails) {
        BiDashboard dashboard = getDashboardById(id);
        if (dashboardDetails.getName() != null)
            dashboard.setName(dashboardDetails.getName());
        if (dashboardDetails.getDescription() != null)
            dashboard.setDescription(dashboardDetails.getDescription());
        if (dashboardDetails.getType() != null)
            dashboard.setType(dashboardDetails.getType());
        if (dashboardDetails.getConfig() != null)
            dashboard.setConfig(dashboardDetails.getConfig());
        dashboard.setFavorite(dashboardDetails.isFavorite());
        return dashboardRepository.save(dashboard);
    }

    @Transactional
    public void deleteDashboard(Long id) {
        dashboardRepository.deleteById(id);
    }
}
