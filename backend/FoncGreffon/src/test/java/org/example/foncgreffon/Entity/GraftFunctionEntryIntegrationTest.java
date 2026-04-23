package org.example.foncgreffon.Entity;



import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.foncgreffon.Repository.GraftFunctionEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
class GraftFunctionEntryIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private GraftFunctionEntryRepository repository;

    @Autowired
    private ObjectMapper objectMapper;

    private GraftFunctionEntry sampleEntry;

    @BeforeEach
    void setUp() {
        repository.deleteAll();
        sampleEntry = new GraftFunctionEntry(
                "patient-001", LocalDate.of(2024, 6, 15),
                1.2, 55.0, 1500.0, 8.5,
                120.0, 80.0, 70.0, 37.1,
                "ROUTINE", "Stable", LocalDateTime.now()
        );
    }

    // ── POST ──────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/graft-entries — creates entry and returns it")
    void createEntry_shouldReturn201() throws Exception {
        mockMvc.perform(post("/api/graft-entries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleEntry)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.patientId").value("patient-001"))
                .andExpect(jsonPath("$.creatinine").value(1.2))
                .andExpect(jsonPath("$.eGFR").value(55.0))
                .andExpect(jsonPath("$.collectionType").value("ROUTINE"))
                .andExpect(jsonPath("$.id").isNumber());
    }

    // ── GET all ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/graft-entries — returns all entries")
    void getAllEntries_shouldReturnList() throws Exception {
        repository.save(sampleEntry);
        GraftFunctionEntry second = new GraftFunctionEntry(
                "patient-002", LocalDate.now(),
                1.5, 45.0, 1200.0, 9.0,
                130.0, 85.0, 75.0, 37.3,
                "URGENT", "Rising creatinine", LocalDateTime.now()
        );
        repository.save(second);

        mockMvc.perform(get("/api/graft-entries"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].patientId",
                        containsInAnyOrder("patient-001", "patient-002")));
    }

    // ── GET by id ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/graft-entries/{id} — returns entry when found")
    void getById_shouldReturnEntry() throws Exception {
        GraftFunctionEntry saved = repository.save(sampleEntry);

        mockMvc.perform(get("/api/graft-entries/" + saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientId").value("patient-001"))
                .andExpect(jsonPath("$.eGFR").value(55.0));
    }

    @Test
    @DisplayName("GET /api/graft-entries/{id} — returns 404 when not found")
    void getById_shouldReturn404() throws Exception {
        mockMvc.perform(get("/api/graft-entries/99999"))
                .andExpect(status().isNotFound());
    }

    // ── GET by patientId ──────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/graft-entries/patient/{patientId} — returns patient entries ordered by date desc")
    void getByPatientId_shouldReturnOrderedEntries() throws Exception {
        GraftFunctionEntry older = new GraftFunctionEntry(
                "patient-001", LocalDate.of(2024, 1, 1),
                1.0, 60.0, 1600.0, 7.5,
                115.0, 75.0, 69.0, 37.0,
                "ROUTINE", "Old entry", LocalDateTime.now()
        );
        GraftFunctionEntry newer = new GraftFunctionEntry(
                "patient-001", LocalDate.of(2024, 6, 1),
                1.4, 48.0, 1300.0, 9.0,
                125.0, 82.0, 71.0, 37.2,
                "ROUTINE", "Newer entry", LocalDateTime.now()
        );
        repository.save(older);
        repository.save(newer);

        mockMvc.perform(get("/api/graft-entries/patient/patient-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                // most recent first
                .andExpect(jsonPath("$[0].measurementDate").value("2024-06-01"))
                .andExpect(jsonPath("$[1].measurementDate").value("2024-01-01"));
    }

    // ── PUT ───────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("PUT /api/graft-entries/{id} — updates entry fields")
    void updateEntry_shouldReturnUpdated() throws Exception {
        GraftFunctionEntry saved = repository.save(sampleEntry);

        GraftFunctionEntry payload = new GraftFunctionEntry(
                "patient-001", LocalDate.of(2024, 8, 1),
                2.0, 35.0, 1000.0, 11.0,
                140.0, 90.0, 73.0, 37.8,
                "URGENT", "Creatinine spike", LocalDateTime.now()
        );

        mockMvc.perform(put("/api/graft-entries/" + saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.creatinine").value(2.0))
                .andExpect(jsonPath("$.eGFR").value(35.0))
                .andExpect(jsonPath("$.collectionType").value("URGENT"));
    }

    @Test
    @DisplayName("PUT /api/graft-entries/{id} — returns 404 when not found")
    void updateEntry_shouldReturn404WhenNotFound() throws Exception {
        mockMvc.perform(put("/api/graft-entries/99999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleEntry)))
                .andExpect(status().isNotFound());
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("DELETE /api/graft-entries/{id} — deletes and confirms removal")
    void deleteEntry_shouldReturn204AndRemove() throws Exception {
        GraftFunctionEntry saved = repository.save(sampleEntry);

        mockMvc.perform(delete("/api/graft-entries/" + saved.getId()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/graft-entries/" + saved.getId()))
                .andExpect(status().isNotFound());
    }
}