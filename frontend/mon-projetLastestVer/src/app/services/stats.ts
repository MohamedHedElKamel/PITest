import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface StatsDTO {
  totalHospitalizations: number;
  criticalPatients: number;
  stablePatients: number;
  averageStayDuration: number;
  occupancyRate: number;
  admissionsByMonth: { [key: string]: number };
  dailyEvolution: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  
  // Via API Gateway
  private apiUrl = 'http://localhost:8084/stats';

  constructor(private http: HttpClient) { }

  getDashboardStats(): Observable<StatsDTO> {
    return this.http.get<StatsDTO>(`${this.apiUrl}/dashboard`);
  }

  getSummary(): Observable<string> {
    return this.http.get(`${this.apiUrl}/summary`, { responseType: 'text' });
  }
}