package org.example.foncgreffon.Repository;

import org.example.foncgreffon.Entity.ReferenceValue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReferenceValueRepository extends JpaRepository<ReferenceValue,Integer> {
    Optional<ReferenceValue> findByPatientId(String patientId);
}
