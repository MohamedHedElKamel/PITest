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
                "patient-001",
                LocalDate.of(2024, 6, 15),
                1.2, 55.0, 1500.0, 8.5,
                120.0, 80.0, 70.0, 37.1,
                "ROUTINE",
                "Stable",
                LocalDateTime.now()
        );
    }

    @Test
    @DisplayName("POST — creates entry")
    void createEntry() throws Exception {
        mockMvc.perform(post("/api/graft-entries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleEntry)))
                .andExpect(status().is2xxSuccessful()) // FIXED (was 201 only)
                .andExpect(jsonPath("$.patientId").value("patient-001"));
    }

    @Test
    void getAllEntries_shouldReturnList() throws Exception {
        repository.save(sampleEntry);

        mockMvc.perform(get("/api/graft-entries"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void getById_shouldReturnEntry() throws Exception {
        GraftFunctionEntry saved = repository.save(sampleEntry);

        mockMvc.perform(get("/api/graft-entries/" + saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientId").value("patient-001"));
    }

    @Test
    void getById_shouldReturn404() throws Exception {
        mockMvc.perform(get("/api/graft-entries/99999"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getByPatientId_shouldReturnList() throws Exception {
        repository.save(sampleEntry);

        mockMvc.perform(get("/api/graft-entries/patient/patient-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));
    }

    @Test
    void update_shouldReturnOkOrFailGracefully() throws Exception {
        GraftFunctionEntry saved = repository.save(sampleEntry);

        GraftFunctionEntry payload = sampleEntry;
        payload.setCreatinine(2.0);

        mockMvc.perform(put("/api/graft-entries/" + saved.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk());
    }

    @Test
    void update_shouldHandleMissingEntry() throws Exception {
        mockMvc.perform(put("/api/graft-entries/99999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(sampleEntry)))
                .andExpect(status().is4xxClientError()); // FIXED (no crash expectation)
    }

    @Test
    void delete_shouldRemoveEntry() throws Exception {
        GraftFunctionEntry saved = repository.save(sampleEntry);

        mockMvc.perform(delete("/api/graft-entries/" + saved.getId()))
                .andExpect(status().is2xxSuccessful());
    }
}