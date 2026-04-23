package org.example.foncgreffon.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import java.time.LocalDate;

@Entity
public class ReferenceValue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientId;
    private LocalDate establishedDate;  // usually 3 months post-transplant

    private Double baselineCreatinine;  // patient's stable baseline
    private Double baselineEGFR;
    private Double targetTacrolimusMin;
    private Double targetTacrolimusMax;
    private Double targetSystolicBP;
    private Double targetDiastolicBP;

    private String setBy;               // nephrologist name
    private String notes;

    public ReferenceValue(String patientId, LocalDate establishedDate, Double baselineCreatinine, Double baselineEGFR, Double targetTacrolimusMin, Double targetTacrolimusMax, Double targetSystolicBP, Double targetDiastolicBP, String setBy, String notes) {
        this.patientId = patientId;
        this.establishedDate = establishedDate;
        this.baselineCreatinine = baselineCreatinine;
        this.baselineEGFR = baselineEGFR;
        this.targetTacrolimusMin = targetTacrolimusMin;
        this.targetTacrolimusMax = targetTacrolimusMax;
        this.targetSystolicBP = targetSystolicBP;
        this.targetDiastolicBP = targetDiastolicBP;
        this.setBy = setBy;
        this.notes = notes;
    }

    public ReferenceValue() {

    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getEstablishedDate() {
        return establishedDate;
    }

    public void setEstablishedDate(LocalDate establishedDate) {
        this.establishedDate = establishedDate;
    }

    public Double getBaselineCreatinine() {
        return baselineCreatinine;
    }

    public void setBaselineCreatinine(Double baselineCreatinine) {
        this.baselineCreatinine = baselineCreatinine;
    }

    public Double getBaselineEGFR() {
        return baselineEGFR;
    }

    public void setBaselineEGFR(Double baselineEGFR) {
        this.baselineEGFR = baselineEGFR;
    }

    public Double getTargetTacrolimusMin() {
        return targetTacrolimusMin;
    }

    public void setTargetTacrolimusMin(Double targetTacrolimusMin) {
        this.targetTacrolimusMin = targetTacrolimusMin;
    }

    public Double getTargetTacrolimusMax() {
        return targetTacrolimusMax;
    }

    public void setTargetTacrolimusMax(Double targetTacrolimusMax) {
        this.targetTacrolimusMax = targetTacrolimusMax;
    }

    public Double getTargetDiastolicBP() {
        return targetDiastolicBP;
    }

    public void setTargetDiastolicBP(Double targetDiastolicBP) {
        this.targetDiastolicBP = targetDiastolicBP;
    }

    public Double getTargetSystolicBP() {
        return targetSystolicBP;
    }

    public void setTargetSystolicBP(Double targetSystolicBP) {
        this.targetSystolicBP = targetSystolicBP;
    }

    public String getSetBy() {
        return setBy;
    }

    public void setSetBy(String setBy) {
        this.setBy = setBy;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
