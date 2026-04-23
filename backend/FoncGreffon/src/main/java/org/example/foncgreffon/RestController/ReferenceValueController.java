package org.example.foncgreffon.RestController;

import org.example.foncgreffon.Entity.ReferenceValue;
import org.example.foncgreffon.Service.ReferenceValueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/reference-values")

public class ReferenceValueController {

    private final ReferenceValueService service;

    public ReferenceValueController(ReferenceValueService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ReferenceValue> create(@RequestBody ReferenceValue ref) {
        return ResponseEntity.ok(service.save(ref));
    }

    @GetMapping
    public ResponseEntity<List<ReferenceValue>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReferenceValue> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ReferenceValue> getByPatient(@PathVariable String patientId) {
        return service.findByPatientId(patientId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReferenceValue> update(@PathVariable Long id,
                                                 @RequestBody ReferenceValue ref) {
        return ResponseEntity.ok(service.update(id, ref));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
