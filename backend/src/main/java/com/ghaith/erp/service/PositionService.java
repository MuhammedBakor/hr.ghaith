package com.ghaith.erp.service;

import com.ghaith.erp.model.Position;
import com.ghaith.erp.repository.PositionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PositionService {
    private final PositionRepository positionRepository;

    public List<Position> getAllPositions(Long branchId) {
        if (branchId != null) {
            return positionRepository.findAllByBranchId(branchId);
        }
        return positionRepository.findAll();
    }

    public Position getPositionById(Long id) {
        return positionRepository.findById(id).orElse(null);
    }

    public Position createPosition(Position position) {
        if (position.getStatus() == null) {
            position.setStatus("active");
        }
        return positionRepository.save(position);
    }

    public Position updatePosition(Long id, Position positionDetails) {
        Position position = positionRepository.findById(id).orElse(null);
        if (position != null) {
            position.setTitle(positionDetails.getTitle());
            position.setDescription(positionDetails.getDescription());
            position.setStatus(positionDetails.getStatus());
            position.setBranchId(positionDetails.getBranchId());
            return positionRepository.save(position);
        }
        return null;
    }

    public void deletePosition(Long id) {
        positionRepository.deleteById(id);
    }
}
