package org.example.foncgreffon.RestController;

import org.example.foncgreffon.DTO.VaccinationDTO;
import org.example.foncgreffon.Entity.GraftSurvivalScore;
import org.example.foncgreffon.Service.GraftSurvivalScoreService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/survival-scores")

public class GraftSurvivalScoreController {

    private final GraftSurvivalScoreService service;

    public GraftSurvivalScoreController(GraftSurvivalScoreService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<GraftSurvivalScore> create(@RequestBody GraftSurvivalScore score) {
        return ResponseEntity.ok(service.save(score));
    }

    @GetMapping
    public ResponseEntity<List<GraftSurvivalScore>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GraftSurvivalScore> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<GraftSurvivalScore>> getByPatient(@PathVariable String patientId) {
        return ResponseEntity.ok(service.findByPatientId(patientId));
    }

    @GetMapping("/patient/{patientId}/latest")
    public ResponseEntity<GraftSurvivalScore> getLatestByPatient(@PathVariable String patientId) {
        return service.findLatestByPatientId(patientId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<GraftSurvivalScore> update(@PathVariable Long id,
                                                     @RequestBody GraftSurvivalScore score) {
        return ResponseEntity.ok(service.update(id, score));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/vaccinations")
    public ResponseEntity<List<VaccinationDTO>> getAllVaccinations() {
        return ResponseEntity.ok(service.getAllVaccinations());
    }
}
