package com.ghaith.erp.service;

import com.ghaith.erp.model.SystemSetting;
import com.ghaith.erp.repository.SystemSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SystemSettingService {

    private final SystemSettingRepository repository;

    public List<SystemSetting> getAllSettings() {
        return repository.findAll();
    }

    public Optional<SystemSetting> getSettingByKey(String key) {
        return repository.findBySettingKey(key);
    }

    @Transactional
    public SystemSetting updateSetting(String key, String value) {
        SystemSetting setting = repository.findBySettingKey(key)
                .orElse(SystemSetting.builder().settingKey(key).build());
        setting.setSettingValue(value);
        return repository.save(setting);
    }

    @Transactional
    public void deleteSetting(String key) {
        repository.findBySettingKey(key).ifPresent(repository::delete);
    }
}
