import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Infection {
  id: number;
  type: string;
  detectionDate: string;
  severity: string;
  patientName: string;
}

export interface Vaccination {
  id: number;
  name: string;
  vaccination_date: string;
  patientName: string;
  booster_date: string;
  infectionId: number | null;
  taken: boolean;
  booster_taken: boolean;
}

@Injectable({ providedIn: 'root' })
export class InfectionVaccinationService {

  private readonly BASE = 'http://localhost:8095';

  constructor(private http: HttpClient) {} // ← ChangeDetectorRef removed

  getAllInfections(): Observable<Infection[]> {
    return this.http.get<Infection[]>(`${this.BASE}/infections`);
  }
  getInfection(id: number): Observable<Infection> {
    return this.http.get<Infection>(`${this.BASE}/infections/${id}`);
  }
  createInfection(body: Omit<Infection, 'id'>): Observable<Infection> {
    return this.http.post<Infection>(`${this.BASE}/infections`, body);
  }
  deleteInfection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/infections/${id}`);
  }
  updateInfection(id: number, body: Omit<Infection, 'id'>): Observable<Infection> {
    return this.http.put<Infection>(`${this.BASE}/infections/${id}`, body);
  }

  getAllVaccinations(): Observable<Vaccination[]> {
    return this.http.get<Vaccination[]>(`${this.BASE}/vaccinations`);
  }
  getVaccination(id: number): Observable<Vaccination> {
    return this.http.get<Vaccination>(`${this.BASE}/vaccinations/${id}`);
  }
  createVaccination(body: Omit<Vaccination, 'id'>): Observable<Vaccination> {
    return this.http.post<Vaccination>(`${this.BASE}/vaccinations`, body);
  }
  deleteVaccination(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/vaccinations/${id}`);
  }
  getVaccinationsByInfection(infectionId: number): Observable<Vaccination[]> {
    return this.http.get<Vaccination[]>(`${this.BASE}/vaccinations/infection/${infectionId}`);
  }
}