package org.example.foncgreffon.Service;

import org.example.foncgreffon.Entity.AlertThreshold;
import org.example.foncgreffon.Repository.AlertThresholdRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AlertThresholdService {

    private final AlertThresholdRepository repository;

    public AlertThresholdService(AlertThresholdRepository repository) {
        this.repository = repository;
    }

    public AlertThreshold save(AlertThreshold threshold) {
        return repository.save(threshold);
    }

    public List<AlertThreshold> findAll() {
        return repository.findAll();
    }

    public Optional<AlertThreshold> findById(Long id) {
        return repository.findById(Math.toIntExact(id));
    }

    public Optional<AlertThreshold> findByPatientId(String patientId) {
        return repository.findByPatientId(patientId);
    }

    public void delete(Long id) {
        repository.deleteById(Math.toIntExact(id));
    }

    public AlertThreshold update(Long id, AlertThreshold updated) {
        return repository.findById(Math.toIntExact(id)).map(threshold -> {
            threshold.setCreatinineRisePercent(updated.getCreatinineRisePercent());
            threshold.seteGFRDropPercent(updated.geteGFRDropPercent());
            threshold.setCreatinineAbsoluteMax(updated.getCreatinineAbsoluteMax());
            threshold.seteGFRCriticalMin(updated.geteGFRCriticalMin());
            threshold.setTacrolimusMin(updated.getTacrolimusMin());
            threshold.setTacrolimusMax(updated.getTacrolimusMax());
            threshold.setAcuteDeclineLevel(updated.getAcuteDeclineLevel());
            threshold.setChronicDeclineLevel(updated.getChronicDeclineLevel());
            threshold.setConfiguredBy(updated.getConfiguredBy());
            threshold.setUpdatedAt(LocalDateTime.now());
            return repository.save(threshold);
        }).orElseThrow(() -> new RuntimeException("AlertThreshold not found: " + id));
    }
}