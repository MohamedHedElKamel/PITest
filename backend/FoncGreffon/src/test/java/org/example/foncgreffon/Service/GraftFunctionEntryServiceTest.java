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
                1.2,   // creatinine
                55.0,  // eGFR
                1500.0,// urineOutput
                8.5,   // tacrolimusLevel
                120.0, // systolicBP
                80.0,  // diastolicBP
                70.0,  // weight
                37.1,  // temperature
                "ROUTINE",
                "Stable post-transplant",
                LocalDateTime.now()
        );
        sampleEntry.setId(1L);
    }

    // ── save ──────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("save() — persists entry and returns it")
    void save_shouldPersistAndReturn() {
        when(repository.save(any(GraftFunctionEntry.class))).thenReturn(sampleEntry);

        GraftFunctionEntry result = service.save(sampleEntry);

        assertThat(result).isNotNull();
        assertThat(result.getPatientId()).isEqualTo("patient-001");
        assertThat(result.getCreatinine()).isEqualTo(1.2);
        assertThat(result.geteGFR()).isEqualTo(55.0);
        verify(repository, times(1)).save(sampleEntry);
    }

    // ── findAll ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findAll() — returns all entries")
    void findAll_shouldReturnAllEntries() {
        GraftFunctionEntry second = new GraftFunctionEntry();
        second.setPatientId("patient-002");
        when(repository.findAll()).thenReturn(List.of(sampleEntry, second));

        List<GraftFunctionEntry> results = service.findAll();

        assertThat(results).hasSize(2);
        assertThat(results).extracting(GraftFunctionEntry::getPatientId)
                .containsExactly("patient-001", "patient-002");
    }

    @Test
    @DisplayName("findAll() — returns empty list when no entries")
    void findAll_shouldReturnEmptyListWhenNone() {
        when(repository.findAll()).thenReturn(List.of());

        assertThat(service.findAll()).isEmpty();
    }

    // ── findById ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("findById() — returns entry when found")
    void findById_shouldReturnEntryWhenFound() {
        when(repository.findById(1)).thenReturn(Optional.of(sampleEntry));

        Optional<GraftFunctionEntry> result = service.findById(1L);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("findById() — returns empty when not found")
    void findById_shouldReturnEmptyWhenNotFound() {
        when(repository.findById(999)).thenReturn(Optional.empty());

        assertThat(service.findById(999L)).isEmpty();
    }

    // ── findByPatientId ───────────────────────────────────────────────────────

    @Test
    @DisplayName("findByPatientId() — returns ordered entries for patient")
    void findByPatientId_shouldReturnEntriesForPatient() {
        when(repository.findByPatientIdOrderByMeasurementDateDesc("patient-001"))
                .thenReturn(List.of(sampleEntry));

        List<GraftFunctionEntry> results = service.findByPatientId("patient-001");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getPatientId()).isEqualTo("patient-001");
    }

    @Test
    @DisplayName("findByPatientId() — returns empty list for unknown patient")
    void findByPatientId_shouldReturnEmptyForUnknownPatient() {
        when(repository.findByPatientIdOrderByMeasurementDateDesc("unknown"))
                .thenReturn(List.of());

        assertThat(service.findByPatientId("unknown")).isEmpty();
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("delete() — calls deleteById on repository")
    void delete_shouldCallDeleteById() {
        doNothing().when(repository).deleteById(1);

        service.delete(1L);

        verify(repository, times(1)).deleteById(1);
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("update() — updates all fields correctly")
    void update_shouldUpdateAllFields() {
        GraftFunctionEntry updated = new GraftFunctionEntry();
        updated.setMeasurementDate(LocalDate.of(2024, 7, 1));
        updated.setCreatinine(1.8);
        updated.seteGFR(40.0);
        updated.setUrineOutput(1200.0);
        updated.setTacrolimusLevel(10.0);
        updated.setSystolicBP(130.0);
        updated.setDiastolicBP(85.0);
        updated.setWeight(72.0);
        updated.setTemperature(37.5);
        updated.setCollectionType("URGENT");
        updated.setNotes("Creatinine rising");

        GraftFunctionEntry saved = new GraftFunctionEntry();
        saved.setId(1L);
        saved.setCreatinine(1.8);
        saved.seteGFR(40.0);
        saved.setCollectionType("URGENT");

        when(repository.findById(1)).thenReturn(Optional.of(sampleEntry));
        when(repository.save(any(GraftFunctionEntry.class))).thenReturn(saved);

        GraftFunctionEntry result = service.update(1L, updated);

        assertThat(result.getCreatinine()).isEqualTo(1.8);
        assertThat(result.geteGFR()).isEqualTo(40.0);
        assertThat(result.getCollectionType()).isEqualTo("URGENT");
        verify(repository, times(1)).save(any(GraftFunctionEntry.class));
    }

    @Test
    @DisplayName("update() — throws RuntimeException when entry not found")
    void update_shouldThrowWhenNotFound() {
        when(repository.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(999L, sampleEntry))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("GraftFunctionEntry not found: 999");

        verify(repository, never()).save(any());
    }

    // ── Medical validation edge cases ─────────────────────────────────────────

    @Test
    @DisplayName("save() — entry with critical eGFR still persists (service has no guard)")
    void save_criticalEGFREntryPersists() {
        sampleEntry.seteGFR(8.0); // critically low
        when(repository.save(any(GraftFunctionEntry.class))).thenReturn(sampleEntry);

        GraftFunctionEntry result = service.save(sampleEntry);

        assertThat(result.geteGFR()).isEqualTo(8.0);
        verify(repository, times(1)).save(any());
    }

    @Test
    @DisplayName("save() — entry with null optional fields is accepted")
    void save_nullOptionalFieldsAreAccepted() {
        GraftFunctionEntry sparse = new GraftFunctionEntry();
        sparse.setPatientId("patient-003");
        sparse.setMeasurementDate(LocalDate.now());
        // all other fields null — only required fields set

        when(repository.save(any(GraftFunctionEntry.class))).thenReturn(sparse);

        GraftFunctionEntry result = service.save(sparse);

        assertThat(result.getCreatinine()).isNull();
        assertThat(result.geteGFR()).isNull();
    }
}