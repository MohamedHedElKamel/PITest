package org.example.foncgreffon.Service;

import org.example.foncgreffon.Entity.GraftFunctionEntry;
import org.example.foncgreffon.Repository.GraftFunctionEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GraftFunctionEntryServiceTest {

    @Mock
    private GraftFunctionEntryRepository repository;

    @InjectMocks
    private GraftFunctionEntryService service;

    private GraftFunctionEntry sampleEntry;

    @BeforeEach
    void setUp() {
        sampleEntry = new GraftFunctionEntry(
                "patient-001",
                LocalDate.of(2024, 6, 15),
                1.2,
                55.0,
                1500.0,
                8.5,
                120.0,
                80.0,
                70.0,
                37.1,
                "ROUTINE",
                "Stable post-transplant",
                LocalDateTime.now()
        );
        sampleEntry.setId(1L);
    }

    // ── SAVE ─────────────────────────────────────────────

    @Test
    @DisplayName("save() — persists entry and returns it")
    void save_shouldPersistAndReturn() {
        when(repository.save(any(GraftFunctionEntry.class))).thenReturn(sampleEntry);

        GraftFunctionEntry result = service.save(sampleEntry);

        assertThat(result).isNotNull();
        verify(repository).save(sampleEntry);
    }

    // ── FIND ALL ─────────────────────────────────────────

    @Test
    void findAll_shouldReturnAllEntries() {
        when(repository.findAll()).thenReturn(List.of(sampleEntry));

        List<GraftFunctionEntry> result = service.findAll();

        assertThat(result).hasSize(1);
    }

    // ── FIND BY ID (FIXED TYPE) ──────────────────────────

    @Test
    void findById_shouldReturnEntryWhenFound() {
        when(repository.findById(1)).thenReturn(Optional.of(sampleEntry));

        Optional<GraftFunctionEntry> result = service.findById(1L);

        assertThat(result).isPresent();
    }

    @Test
    void findById_shouldReturnEmptyWhenNotFound() {
        when(repository.findById(999)).thenReturn(Optional.empty());

        assertThat(service.findById(999L)).isEmpty();
    }

    // ── FIND BY PATIENT ──────────────────────────────────

    @Test
    void findByPatientId_shouldReturnEntries() {
        when(repository.findByPatientIdOrderByMeasurementDateDesc("patient-001"))
                .thenReturn(List.of(sampleEntry));

        List<GraftFunctionEntry> result = service.findByPatientId("patient-001");

        assertThat(result).hasSize(1);
    }

    // ── DELETE (FIXED TYPE ISSUE) ────────────────────────

    @Test
    void delete_shouldCallRepository() {
        doNothing().when(repository).deleteById(1);

        service.delete(1L);

        verify(repository).deleteById(1);
    }

    // ── UPDATE ───────────────────────────────────────────

    @Test
    void update_shouldUpdateEntry() {
        GraftFunctionEntry updated = new GraftFunctionEntry();
        updated.setCreatinine(2.0);

        when(repository.findById(1)).thenReturn(Optional.of(sampleEntry));
        when(repository.save(any())).thenReturn(sampleEntry);

        GraftFunctionEntry result = service.update(1L, updated);

        assertThat(result).isNotNull();
        verify(repository).save(any());
    }

    @Test
    void update_shouldThrowWhenNotFound() {
        when(repository.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(999L, sampleEntry))
                .isInstanceOf(RuntimeException.class);
    }
}