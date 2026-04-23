package org.example.foncgreffon.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import java.time.LocalDateTime;

@Entity
public class AlertThreshold {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientId;

    // percentage rise above baseline that triggers alert
    private Double creatinineRisePercent;    // e.g. 25.0 → +25%
    private Double eGFRDropPercent;          // e.g. 20.0 → -20%

    // absolute values
    private Double creatinineAbsoluteMax;    // e.g. 3.0 mg/dL
    private Double eGFRCriticalMin;          // e.g. 20 mL/min
    private Double tacrolimusMin;
    private Double tacrolimusMax;

    private AlertLevel acuteDeclineLevel;    // WATCH / WARNING / CRITICAL
    private AlertLevel chronicDeclineLevel;

    private String configuredBy;
    private LocalDateTime updatedAt;

    public AlertThreshold(String patientId, Double creatinineRisePercent, Double creatinineAbsoluteMax, Double eGFRDropPercent, Double eGFRCriticalMin, Double tacrolimusMin, Double tacrolimusMax, AlertLevel acuteDeclineLevel, AlertLevel chronicDeclineLevel, String configuredBy, LocalDateTime updatedAt) {
        this.patientId = patientId;
        this.creatinineRisePercent = creatinineRisePercent;
        this.creatinineAbsoluteMax = creatinineAbsoluteMax;
        this.eGFRDropPercent = eGFRDropPercent;
        this.eGFRCriticalMin = eGFRCriticalMin;
        this.tacrolimusMin = tacrolimusMin;
        this.tacrolimusMax = tacrolimusMax;
        this.acuteDeclineLevel = acuteDeclineLevel;
        this.chronicDeclineLevel = chronicDeclineLevel;
        this.configuredBy = configuredBy;
        this.updatedAt = updatedAt;
    }

    public AlertThreshold() {

    }

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public Double getCreatinineRisePercent() {
        return creatinineRisePercent;
    }

    public void setCreatinineRisePercent(Double creatinineRisePercent) {
        this.creatinineRisePercent = creatinineRisePercent;
    }

    public Double geteGFRDropPercent() {
        return eGFRDropPercent;
    }

    public void seteGFRDropPercent(Double eGFRDropPercent) {
        this.eGFRDropPercent = eGFRDropPercent;
    }

    public Double getCreatinineAbsoluteMax() {
        return creatinineAbsoluteMax;
    }

    public void setCreatinineAbsoluteMax(Double creatinineAbsoluteMax) {
        this.creatinineAbsoluteMax = creatinineAbsoluteMax;
    }

    public Double geteGFRCriticalMin() {
        return eGFRCriticalMin;
    }

    public void seteGFRCriticalMin(Double eGFRCriticalMin) {
        this.eGFRCriticalMin = eGFRCriticalMin;
    }

    public Double getTacrolimusMin() {
        return tacrolimusMin;
    }

    public void setTacrolimusMin(Double tacrolimusMin) {
        this.tacrolimusMin = tacrolimusMin;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Double getTacrolimusMax() {
        return tacrolimusMax;
    }

    public void setTacrolimusMax(Double tacrolimusMax) {
        this.tacrolimusMax = tacrolimusMax;
    }

    public AlertLevel getAcuteDeclineLevel() {
        return acuteDeclineLevel;
    }

    public void setAcuteDeclineLevel(AlertLevel acuteDeclineLevel) {
        this.acuteDeclineLevel = acuteDeclineLevel;
    }

    public AlertLevel getChronicDeclineLevel() {
        return chronicDeclineLevel;
    }

    public void setChronicDeclineLevel(AlertLevel chronicDeclineLevel) {
        this.chronicDeclineLevel = chronicDeclineLevel;
    }

    public String getConfiguredBy() {
        return configuredBy;
    }

    public void setConfiguredBy(String configuredBy) {
        this.configuredBy = configuredBy;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}