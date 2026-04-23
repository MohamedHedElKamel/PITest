package org.example.foncgreffon.Service;

import org.example.foncgreffon.Clients.VaccinationClient;
import org.example.foncgreffon.DTO.VaccinationDTO;
import org.example.foncgreffon.Entity.GraftSurvivalScore;
import org.example.foncgreffon.Repository.GraftSurvivalScoreRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class GraftSurvivalScoreService {

    private final GraftSurvivalScoreRepository repository;
    private final VaccinationClient vaccinationClient;

    public GraftSurvivalScoreService(GraftSurvivalScoreRepository repository, VaccinationClient vaccinationClient) {
        this.repository = repository;
        this.vaccinationClient = vaccinationClient;
    }

    public GraftSurvivalScore save(GraftSurvivalScore score) {
        return repository.save(score);
    }

    public List<GraftSurvivalScore> findAll() {
        return repository.findAll();
    }

    public Optional<GraftSurvivalScore> findById(Long id) {
        return repository.findById(Math.toIntExact(id));
    }

    public List<GraftSurvivalScore> findByPatientId(String patientId) {
        return repository.findByPatientIdOrderByCalculatedAtDesc(patientId);
    }

    public Optional<GraftSurvivalScore> findLatestByPatientId(String patientId) {
        return repository.findTopByPatientIdOrderByCalculatedAtDesc(patientId);
    }

    public void delete(Long id) {
        repository.deleteById(Math.toIntExact(id));
    }

    public GraftSurvivalScore update(Long id, GraftSurvivalScore updated) {
        return repository.findById(Math.toIntExact(id)).map(score -> {
            score.setSurvivalProbability1Year(updated.getSurvivalProbability1Year());
            score.setSurvivalProbability3Year(updated.getSurvivalProbability3Year());
            score.setSurvivalProbability5Year(updated.getSurvivalProbability5Year());
            score.setRiskLevel(updated.getRiskLevel());
            score.seteGFRSlope(updated.geteGFRSlope());
            score.setCreatinineSlope(updated.getCreatinineSlope());
            score.setRejectionEpisodeCount(updated.getRejectionEpisodeCount());
            score.setHasChronicDecline(updated.getHasChronicDecline());
            score.setHasAcuteDecline(updated.getHasAcuteDecline());
            score.setTacrolimusVariability(updated.getTacrolimusVariability());
            score.setCalculationModel(updated.getCalculationModel());
            score.setNotes(updated.getNotes());
            score.setCalculatedAt(LocalDateTime.now());
            return repository.save(score);
        }).orElseThrow(() -> new RuntimeException("GraftSurvivalScore not found: " + id));
    }
    public List<VaccinationDTO> getAllVaccinations() {
        return vaccinationClient.getAllVaccinations();
    }
}