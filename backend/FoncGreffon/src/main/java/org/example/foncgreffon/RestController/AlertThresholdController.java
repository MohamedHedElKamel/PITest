package org.example.foncgreffon.RestController;

import org.example.foncgreffon.Entity.AlertThreshold;
import org.example.foncgreffon.Service.AlertThresholdService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/alert-thresholds")

public class AlertThresholdController {

    private final AlertThresholdService service;

    public AlertThresholdController(AlertThresholdService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<AlertThreshold> create(@RequestBody AlertThreshold threshold) {
        return ResponseEntity.ok(service.save(threshold));
    }

    @GetMapping
    public ResponseEntity<List<AlertThreshold>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlertThreshold> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<AlertThreshold> getByPatient(@PathVariable String patientId) {
        return service.findByPatientId(patientId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<AlertThreshold> update(@PathVariable Long id,
                                                 @RequestBody AlertThreshold threshold) {
        return ResponseEntity.ok(service.update(id, threshold));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
