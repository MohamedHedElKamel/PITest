package org.example.foncgreffon.Repository;

import org.example.foncgreffon.Entity.GraftFunctionEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GraftFunctionEntryRepository extends JpaRepository<GraftFunctionEntry,Integer>{
    List<GraftFunctionEntry> findByPatientIdOrderByMeasurementDateDesc(String patientId);
}