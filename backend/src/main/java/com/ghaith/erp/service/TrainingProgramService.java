package com.ghaith.erp.service;

import com.ghaith.erp.model.TrainingProgram;
import com.ghaith.erp.repository.TrainingProgramRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TrainingProgramService {

    private final TrainingProgramRepository repository;

    public List<TrainingProgram> getAllPrograms() {
        return repository.findAll();
    }

    public Optional<TrainingProgram> getProgramById(Long id) {
        return repository.findById(id);
    }

    public TrainingProgram createProgram(TrainingProgram program) {
        return repository.save(program);
    }

    public TrainingProgram updateProgram(Long id, TrainingProgram programDetails) {
        return repository.findById(id).map(program -> {
            program.setName(programDetails.getName());
            program.setDescription(programDetails.getDescription());
            program.setTrainingType(programDetails.getTrainingType());
            program.setProvider(programDetails.getProvider());
            program.setDuration(programDetails.getDuration());
            program.setDurationUnit(programDetails.getDurationUnit());
            program.setCost(programDetails.getCost());
            program.setMaxParticipants(programDetails.getMaxParticipants());
            program.setStatus(programDetails.getStatus());
            return repository.save(program);
        }).orElseThrow(() -> new RuntimeException("Training Program not found with id " + id));
    }

    public void deleteProgram(Long id) {
        repository.deleteById(id);
    }
}
