package org.example.foncgreffon.Repository;

import org.example.foncgreffon.Entity.AlertThreshold;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AlertThresholdRepository extends JpaRepository<AlertThreshold,Integer> {
    Optional<AlertThreshold> findByPatientId(String patientId);
}
