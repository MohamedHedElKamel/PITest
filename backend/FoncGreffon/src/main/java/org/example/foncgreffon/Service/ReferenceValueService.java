package org.example.foncgreffon.Service;

import org.example.foncgreffon.Entity.ReferenceValue;
import org.example.foncgreffon.Repository.ReferenceValueRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ReferenceValueService {

    private final ReferenceValueRepository repository;

    public ReferenceValueService(ReferenceValueRepository repository) {
        this.repository = repository;
    }

    public ReferenceValue save(ReferenceValue ref) {
        return repository.save(ref);
    }

    public List<ReferenceValue> findAll() {
        return repository.findAll();
    }

    public Optional<ReferenceValue> findById(Long id) {
        return repository.findById(Math.toIntExact(id));
    }

    public Optional<ReferenceValue> findByPatientId(String patientId) {
        return repository.findByPatientId(patientId);
    }

    public void delete(Long id) {
        repository.deleteById(Math.toIntExact(id));
    }

    public ReferenceValue update(Long id, ReferenceValue updated) {
        return repository.findById(Math.toIntExact(id)).map(ref -> {
            ref.setEstablishedDate(updated.getEstablishedDate());
            ref.setBaselineCreatinine(updated.getBaselineCreatinine());
            ref.setBaselineEGFR(updated.getBaselineEGFR());
            ref.setTargetTacrolimusMin(updated.getTargetTacrolimusMin());
            ref.setTargetTacrolimusMax(updated.getTargetTacrolimusMax());
            ref.setTargetSystolicBP(updated.getTargetSystolicBP());
            ref.setTargetDiastolicBP(updated.getTargetDiastolicBP());
            ref.setSetBy(updated.getSetBy());
            ref.setNotes(updated.getNotes());
            return repository.save(ref);
        }).orElseThrow(() -> new RuntimeException("ReferenceValue not found: " + id));
    }
}