import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GraftFunctionEntry {
  id: number;
  patientId: string;
  measurementDate: string;
  creatinine: number | null;
  eGFR: number | null;
  urineOutput: number | null;
  tacrolimusLevel: number | null;
  systolicBP: number | null;
  diastolicBP: number | null;
  weight: number | null;
  temperature: number | null;
  collectionType: string;
  notes: string;
  createdAt?: string;
}

export interface ReferenceValue {
  id: number;
  patientId: string;
  establishedDate: string;
  baselineCreatinine: number | null;
  baselineEGFR: number | null;
  targetTacrolimusMin: number | null;
  targetTacrolimusMax: number | null;
  targetSystolicBP: number | null;
  targetDiastolicBP: number | null;
  setBy: string;
  notes: string;
}

export interface AlertThreshold {
  id: number;
  patientId: string;
  creatinineRisePercent: number | null;
  eGFRDropPercent: number | null;
  creatinineAbsoluteMax: number | null;
  eGFRCriticalMin: number | null;
  tacrolimusMin: number | null;
  tacrolimusMax: number | null;
  acuteDeclineLevel: string;
  chronicDeclineLevel: string;
  configuredBy: string;
  updatedAt?: string;
}

export interface GraftSurvivalScore {
  id: number;
  patientId: string;
  calculatedAt?: string;
  survivalProbability1Year: number | null;
  survivalProbability3Year: number | null;
  survivalProbability5Year: number | null;
  riskLevel: string;
  eGFRSlope: number | null;
  creatinineSlope: number | null;
  rejectionEpisodeCount: number | null;
  hasChronicDecline: boolean;
  hasAcuteDecline: boolean;
  tacrolimusVariability: number | null;
  calculationModel: string;
  notes: string;
}

@Injectable({ providedIn: 'root' })
export class GraftFunctionService {

private base = 'http://localhost:8095/api';
  constructor(private http: HttpClient) {}

  // ── GraftFunctionEntry ──────────────────────────────────────
  getAllEntries(): Observable<GraftFunctionEntry[]> {
    return this.http.get<GraftFunctionEntry[]>(`${this.base}/graft-entries`);
  }
  getEntriesByPatient(patientId: string): Observable<GraftFunctionEntry[]> {
    return this.http.get<GraftFunctionEntry[]>(`${this.base}/graft-entries/patient/${patientId}`);
  }
  createEntry(e: Partial<GraftFunctionEntry>): Observable<GraftFunctionEntry> {
    return this.http.post<GraftFunctionEntry>(`${this.base}/graft-entries`, e);
  }
  updateEntry(id: number, e: Partial<GraftFunctionEntry>): Observable<GraftFunctionEntry> {
    return this.http.put<GraftFunctionEntry>(`${this.base}/graft-entries/${id}`, e);
  }
  deleteEntry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/graft-entries/${id}`);
  }

  // ── ReferenceValue ──────────────────────────────────────────
  getAllRefs(): Observable<ReferenceValue[]> {
    return this.http.get<ReferenceValue[]>(`${this.base}/reference-values`);
  }
  getRefByPatient(patientId: string): Observable<ReferenceValue> {
    return this.http.get<ReferenceValue>(`${this.base}/reference-values/patient/${patientId}`);
  }
  createRef(r: Partial<ReferenceValue>): Observable<ReferenceValue> {
    return this.http.post<ReferenceValue>(`${this.base}/reference-values`, r);
  }
  updateRef(id: number, r: Partial<ReferenceValue>): Observable<ReferenceValue> {
    return this.http.put<ReferenceValue>(`${this.base}/reference-values/${id}`, r);
  }
  deleteRef(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/reference-values/${id}`);
  }

  // ── AlertThreshold ──────────────────────────────────────────
  getAllThresholds(): Observable<AlertThreshold[]> {
    return this.http.get<AlertThreshold[]>(`${this.base}/alert-thresholds`);
  }
  getThresholdByPatient(patientId: string): Observable<AlertThreshold> {
    return this.http.get<AlertThreshold>(`${this.base}/alert-thresholds/patient/${patientId}`);
  }
  createThreshold(t: Partial<AlertThreshold>): Observable<AlertThreshold> {
    return this.http.post<AlertThreshold>(`${this.base}/alert-thresholds`, t);
  }
  updateThreshold(id: number, t: Partial<AlertThreshold>): Observable<AlertThreshold> {
    return this.http.put<AlertThreshold>(`${this.base}/alert-thresholds/${id}`, t);
  }
  deleteThreshold(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/alert-thresholds/${id}`);
  }

  // ── GraftSurvivalScore ──────────────────────────────────────
  getAllScores(): Observable<GraftSurvivalScore[]> {
    return this.http.get<GraftSurvivalScore[]>(`${this.base}/survival-scores`);
  }
  getScoresByPatient(patientId: string): Observable<GraftSurvivalScore[]> {
    return this.http.get<GraftSurvivalScore[]>(`${this.base}/survival-scores/patient/${patientId}`);
  }
  getLatestScore(patientId: string): Observable<GraftSurvivalScore> {
    return this.http.get<GraftSurvivalScore>(`${this.base}/survival-scores/patient/${patientId}/latest`);
  }
  createScore(s: Partial<GraftSurvivalScore>): Observable<GraftSurvivalScore> {
    return this.http.post<GraftSurvivalScore>(`${this.base}/survival-scores`, s);
  }
  updateScore(id: number, s: Partial<GraftSurvivalScore>): Observable<GraftSurvivalScore> {
    return this.http.put<GraftSurvivalScore>(`${this.base}/survival-scores/${id}`, s);
  }
  deleteScore(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/survival-scores/${id}`);
  }
  // In graft-function.service.ts
getVaccinations(): Observable<any[]> {
  return this.http.get<any[]>(`${this.base}/survival-scores/vaccinations`);
}
}