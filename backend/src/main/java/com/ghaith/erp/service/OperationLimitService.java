package com.ghaith.erp.service;

import com.ghaith.erp.model.OperationLimit;
import com.ghaith.erp.repository.OperationLimitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OperationLimitService {

    private final OperationLimitRepository repository;

    public List<OperationLimit> getAllLimits() {
        return repository.findAll();
    }

    @Transactional
    public OperationLimit createLimit(OperationLimit limit) {
        return repository.save(limit);
    }

    @Transactional
    public void deleteLimit(Long id) {
        repository.deleteById(id);
    }
}
