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

    @Test
    void save_shouldPersistAndReturn() {
        when(repository.save(any())).thenReturn(sampleEntry);

        GraftFunctionEntry result = service.save(sampleEntry);

        assertThat(result).isNotNull();
        assertThat(result.getPatientId()).isEqualTo("patient-001");
        verify(repository).save(any());
    }

    @Test
    void findAll_shouldReturnAllEntries() {
        GraftFunctionEntry second = new GraftFunctionEntry();
        second.setPatientId("patient-002");

        when(repository.findAll()).thenReturn(List.of(sampleEntry, second));

        List<GraftFunctionEntry> results = service.findAll();

        assertThat(results).hasSize(2);
    }

    @Test
    void findAll_shouldReturnEmptyListWhenNone() {
        when(repository.findAll()).thenReturn(List.of());

        assertThat(service.findAll()).isEmpty();
    }

    @Test
    void findById_shouldReturnEntryWhenFound() {
        when(repository.findById(1L)).thenReturn(Optional.of(sampleEntry));

        Optional<GraftFunctionEntry> result = service.findById(1L);

        assertThat(result).isPresent();
    }

    @Test
    void findById_shouldReturnEmptyWhenNotFound() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        assertThat(service.findById(999L)).isEmpty();
    }

    @Test
    void delete_shouldCallDeleteById() {
        doNothing().when(repository).deleteById(1L);

        service.delete(1L);

        verify(repository).deleteById(1L);
    }

    @Test
    void update_shouldThrowWhenNotFound() {
        when(repository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(999L, sampleEntry))
                .isInstanceOf(RuntimeException.class);
    }
}