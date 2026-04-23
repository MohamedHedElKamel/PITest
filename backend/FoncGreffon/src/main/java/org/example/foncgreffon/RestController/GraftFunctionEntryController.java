package org.example.foncgreffon.RestController;

import org.example.foncgreffon.Entity.GraftFunctionEntry;
import org.example.foncgreffon.Service.GraftFunctionEntryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/graft-entries")

public class GraftFunctionEntryController {

    private final GraftFunctionEntryService service;

    public GraftFunctionEntryController(GraftFunctionEntryService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<GraftFunctionEntry> create(@RequestBody GraftFunctionEntry entry) {
        return ResponseEntity.ok(service.save(entry));
    }

    @GetMapping
    public ResponseEntity<List<GraftFunctionEntry>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GraftFunctionEntry> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('MEDECIN')")
    public ResponseEntity<List<GraftFunctionEntry>> getByPatient(@PathVariable String patientId) {
        return ResponseEntity.ok(service.findByPatientId(patientId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GraftFunctionEntry> update(@PathVariable Long id,
                                                     @RequestBody GraftFunctionEntry entry) {
        return ResponseEntity.ok(service.update(id, entry));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/all")
    public ResponseEntity<List<GraftFunctionEntry>> getAllGraftFunctionEntry() {
        return ResponseEntity.ok(service.findAll());
    }



}

