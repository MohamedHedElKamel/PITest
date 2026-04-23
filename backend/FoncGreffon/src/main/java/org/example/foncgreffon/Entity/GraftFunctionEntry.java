package org.example.foncgreffon.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
public class GraftFunctionEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientId;
    private LocalDate measurementDate;

    private Double creatinine;        // mg/dL
    private Double eGFR;              // mL/min/1.73m²
    private Double urineOutput;       // mL/24h
    private Double tacrolimusLevel;   // ng/mL trough
    private Double systolicBP;
    private Double diastolicBP;
    private Double weight;            // kg
    private Double temperature;       // °C

    private String collectionType;    // ROUTINE / URGENT / POST_BIOPSY
    private String notes;
    private LocalDateTime createdAt;


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public LocalDate getMeasurementDate() {
        return measurementDate;
    }

    public void setMeasurementDate(LocalDate measurementDate) {
        this.measurementDate = measurementDate;
    }

    public Double getCreatinine() {
        return creatinine;
    }

    public void setCreatinine(Double creatinine) {
        this.creatinine = creatinine;
    }

    public Double geteGFR() {
        return eGFR;
    }

    public void seteGFR(Double eGFR) {
        this.eGFR = eGFR;
    }

    public Double getUrineOutput() {
        return urineOutput;
    }

    public void setUrineOutput(Double urineOutput) {
        this.urineOutput = urineOutput;
    }

    public Double getTacrolimusLevel() {
        return tacrolimusLevel;
    }

    public void setTacrolimusLevel(Double tacrolimusLevel) {
        this.tacrolimusLevel = tacrolimusLevel;
    }

    public Double getSystolicBP() {
        return systolicBP;
    }

    public void setSystolicBP(Double systolicBP) {
        this.systolicBP = systolicBP;
    }

    public Double getDiastolicBP() {
        return diastolicBP;
    }

    public void setDiastolicBP(Double diastolicBP) {
        this.diastolicBP = diastolicBP;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public String getCollectionType() {
        return collectionType;
    }

    public void setCollectionType(String collectionType) {
        this.collectionType = collectionType;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public GraftFunctionEntry(String patientId, LocalDate measurementDate, Double creatinine, Double eGFR, Double urineOutput, Double tacrolimusLevel, Double systolicBP, Double diastolicBP, Double weight, Double temperature, String collectionType, String notes, LocalDateTime createdAt) {
        this.patientId = patientId;
        this.measurementDate = measurementDate;
        this.creatinine = creatinine;
        this.eGFR = eGFR;
        this.urineOutput = urineOutput;
        this.tacrolimusLevel = tacrolimusLevel;
        this.systolicBP = systolicBP;
        this.diastolicBP = diastolicBP;
        this.weight = weight;
        this.temperature = temperature;
        this.collectionType = collectionType;
        this.notes = notes;
        this.createdAt = createdAt;
    }

    public GraftFunctionEntry() {

    }


}