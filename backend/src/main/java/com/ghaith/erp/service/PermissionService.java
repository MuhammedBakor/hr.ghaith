package com.ghaith.erp.service;

import com.ghaith.erp.model.SystemSetting;
import com.ghaith.erp.repository.SystemSettingRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final SystemSettingRepository settingRepository;
    private final ObjectMapper objectMapper;
    private static final String PERMISSION_MATRIX_KEY = "system.permission_matrix";

    @SuppressWarnings("unchecked")
    public Map<String, Map<String, Boolean>> getPermissionMatrix() {
        return settingRepository.findBySettingKey(PERMISSION_MATRIX_KEY)
                .map(setting -> {
                    try {
                        return objectMapper.readValue(setting.getSettingValue(), Map.class);
                    } catch (JsonProcessingException e) {
                        return new HashMap<String, Map<String, Boolean>>();
                    }
                })
                .orElse(new HashMap<>());
    }

    @Transactional
    public void updatePermissionMatrix(Map<String, Map<String, Boolean>> matrix) {
        try {
            String json = objectMapper.writeValueAsString(matrix);
            SystemSetting setting = settingRepository.findBySettingKey(PERMISSION_MATRIX_KEY)
                    .orElse(SystemSetting.builder().settingKey(PERMISSION_MATRIX_KEY).build());
            setting.setSettingValue(json);
            settingRepository.save(setting);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize permission matrix", e);
        }
    }
}
