package org.example.foncgreffon.Repository;

import org.example.foncgreffon.Entity.GraftSurvivalScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GraftSurvivalScoreRepository extends JpaRepository<GraftSurvivalScore,Integer> {
    List<GraftSurvivalScore> findByPatientIdOrderByCalculatedAtDesc(String patientId);
    Optional<GraftSurvivalScore> findTopByPatientIdOrderByCalculatedAtDesc(String patientId);
}
