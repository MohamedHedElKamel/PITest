package org.example.foncgreffon.DTO;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Date;

@JsonIgnoreProperties(ignoreUnknown = true)
public class VaccinationDTO {
    private int id;
    private String name;
    private Date vaccination_date;   // match the JSON field name from InfectionetVaccination
    private String patientName;
    private Date booster_date;
    private boolean taken;
    private boolean booster_taken;

    // Getters and setters (or use Lombok)
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Date getVaccination_date() { return vaccination_date; }
    public void setVaccination_date(Date vaccination_date) { this.vaccination_date = vaccination_date; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public Date getBooster_date() { return booster_date; }
    public void setBooster_date(Date booster_date) { this.booster_date = booster_date; }

    public boolean isTaken() { return taken; }
    public void setTaken(boolean taken) { this.taken = taken; }

    public boolean isBooster_taken() { return booster_taken; }
    public void setBooster_taken(boolean booster_taken) { this.booster_taken = booster_taken; }
}