package org.example.foncgreffon.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import java.time.LocalDateTime;

@Entity
public class GraftSurvivalScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientId;
    private LocalDateTime calculatedAt;

    private Double survivalProbability1Year;   // 0.0 – 1.0
    private Double survivalProbability3Year;
    private Double survivalProbability5Year;

    private RiskLevel riskLevel;               // LOW / MODERATE / HIGH / CRITICAL

    // contributing factors stored for audit
    private Double eGFRSlope;                  // mL/min per month over last 90 days
    private Double creatinineSlope;
    private Integer rejectionEpisodeCount;
    private Boolean hasChronicDecline;
    private Boolean hasAcuteDecline;
    private Double tacrolimusVariability;      // coefficient of variation

    private String calculationModel;           // e.g. "ELAPSED_TIME_V1"
    private String notes;


    public GraftSurvivalScore(String patientId, LocalDateTime calculatedAt, Double survivalProbability1Year, Double survivalProbability3Year, Double survivalProbability5Year, RiskLevel riskLevel, Double eGFRSlope, Double creatinineSlope, Integer rejectionEpisodeCount, Boolean hasChronicDecline, Boolean hasAcuteDecline, Double tacrolimusVariability, String calculationModel, String notes) {
        this.patientId = patientId;
        this.calculatedAt = calculatedAt;
        this.survivalProbability1Year = survivalProbability1Year;
        this.survivalProbability3Year = survivalProbability3Year;
        this.survivalProbability5Year = survivalProbability5Year;
        this.riskLevel = riskLevel;
        this.eGFRSlope = eGFRSlope;
        this.creatinineSlope = creatinineSlope;
        this.rejectionEpisodeCount = rejectionEpisodeCount;
        this.hasChronicDecline = hasChronicDecline;
        this.hasAcuteDecline = hasAcuteDecline;
        this.tacrolimusVariability = tacrolimusVariability;
        this.calculationModel = calculationModel;
        this.notes = notes;
    }

    public GraftSurvivalScore() {

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

    public LocalDateTime getCalculatedAt() {
        return calculatedAt;
    }

    public void setCalculatedAt(LocalDateTime calculatedAt) {
        this.calculatedAt = calculatedAt;
    }

    public Double getSurvivalProbability1Year() {
        return survivalProbability1Year;
    }

    public void setSurvivalProbability1Year(Double survivalProbability1Year) {
        this.survivalProbability1Year = survivalProbability1Year;
    }

    public Double getSurvivalProbability3Year() {
        return survivalProbability3Year;
    }

    public void setSurvivalProbability3Year(Double survivalProbability3Year) {
        this.survivalProbability3Year = survivalProbability3Year;
    }

    public Double getSurvivalProbability5Year() {
        return survivalProbability5Year;
    }

    public void setSurvivalProbability5Year(Double survivalProbability5Year) {
        this.survivalProbability5Year = survivalProbability5Year;
    }

    public RiskLevel getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(RiskLevel riskLevel) {
        this.riskLevel = riskLevel;
    }

    public Double geteGFRSlope() {
        return eGFRSlope;
    }

    public void seteGFRSlope(Double eGFRSlope) {
        this.eGFRSlope = eGFRSlope;
    }

    public Double getCreatinineSlope() {
        return creatinineSlope;
    }

    public void setCreatinineSlope(Double creatinineSlope) {
        this.creatinineSlope = creatinineSlope;
    }

    public Integer getRejectionEpisodeCount() {
        return rejectionEpisodeCount;
    }

    public void setRejectionEpisodeCount(Integer rejectionEpisodeCount) {
        this.rejectionEpisodeCount = rejectionEpisodeCount;
    }

    public Boolean getHasChronicDecline() {
        return hasChronicDecline;
    }

    public void setHasChronicDecline(Boolean hasChronicDecline) {
        this.hasChronicDecline = hasChronicDecline;
    }

    public Boolean getHasAcuteDecline() {
        return hasAcuteDecline;
    }

    public void setHasAcuteDecline(Boolean hasAcuteDecline) {
        this.hasAcuteDecline = hasAcuteDecline;
    }

    public Double getTacrolimusVariability() {
        return tacrolimusVariability;
    }

    public void setTacrolimusVariability(Double tacrolimusVariability) {
        this.tacrolimusVariability = tacrolimusVariability;
    }

    public String getCalculationModel() {
        return calculationModel;
    }

    public void setCalculationModel(String calculationModel) {
        this.calculationModel = calculationModel;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
