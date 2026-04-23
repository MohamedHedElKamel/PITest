import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Modèle pour un daily report (inclus dans l'hospitalisation)
 */
export interface DailyReportSummaryModel {
  idReport: number;
  date: string;        // Format: "2026-02-26T10:30:00"
  observation: string;
}

/**
 * Modèle pour une hospitalisation
 */
export interface HospitalisationModel {
  idHospitalization: number;
  reason: string;
  admissionDate: string;     // Format: "2026-02-28T10:00:00"
  dischargeDate: string | null;
  room: string;
  status: string;            // "STABLE", "CRITIQUE", etc.
  dailyReports?: DailyReportSummaryModel[];  // Tableau des daily reports
}

/**
 * Type pour la création (sans l'id et sans les dailyReports)
 */
export type HospitalisationCreateDto = Omit<HospitalisationModel, 'idHospitalization' | 'dailyReports'>;

@Injectable({
  providedIn: 'root',
})
export class HospitalisationService {
  // URL de l'API Gateway
  private readonly baseUrl = 'http://localhost:8093/hospitalization';

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les hospitalisations avec leurs daily reports
   * @returns Observable<HospitalisationModel[]>
   */
  getAll(): Observable<HospitalisationModel[]> {
    console.debug('GET all hospitalisations from:', `${this.baseUrl}/all`);
    return this.http.get<HospitalisationModel[]>(`${this.baseUrl}/all`);
  }

  /**
   * Crée une nouvelle hospitalisation
   * @param payload Données de l'hospitalisation (sans id ni dailyReports)
   * @returns Observable<HospitalisationModel>
   */
  create(payload: HospitalisationCreateDto): Observable<HospitalisationModel> {
    const formattedPayload = {
      ...payload,
      admissionDate: this.formatToDateTime(payload.admissionDate),
      dischargeDate: payload.dischargeDate ? this.formatToDateTime(payload.dischargeDate) : null
    };
    console.debug('POST create hospitalisation:', `${this.baseUrl}/add`, formattedPayload);
    return this.http.post<HospitalisationModel>(`${this.baseUrl}/add`, formattedPayload);
  }

  /**
   * Met à jour une hospitalisation existante
   * @param payload Données complètes de l'hospitalisation
   * @returns Observable<HospitalisationModel>
   */
  update(payload: HospitalisationModel): Observable<HospitalisationModel> {
    const formattedPayload = {
      ...payload,
      admissionDate: this.formatToDateTime(payload.admissionDate),
      dischargeDate: payload.dischargeDate ? this.formatToDateTime(payload.dischargeDate) : null
    };
    console.debug('PUT update hospitalisation:', `${this.baseUrl}/update`, formattedPayload);
    return this.http.put<HospitalisationModel>(`${this.baseUrl}/update`, formattedPayload);
  }

  /**
   * Supprime une hospitalisation
   * @param id ID de l'hospitalisation à supprimer
   * @returns Observable<void>
   */
  delete(id: number): Observable<void> {
    console.debug('DELETE hospitalisation:', `${this.baseUrl}/delete/${id}`);
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`);
  }

  /**
   * Convertit une date string au format LocalDateTime (YYYY-MM-DDTHH:mm:ss)
   * @param dateStr Date au format YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
   * @returns Date formatée pour l'API
   */
  private formatToDateTime(dateStr: string): string {
    if (!dateStr) return dateStr;
    
    // Si déjà au format datetime, on retourne tel quel
    if (dateStr.includes('T')) {
      return dateStr;
    }
    
    // Ajout de l'heure (minuit) pour les dates seules
    return `${dateStr}T00:00:00`;
  }

  /**
   * Helper pour rafraîchir la liste après une opération
   * Utile pour les composants qui ont besoin de recharger les données
   */
  refreshList(): Observable<HospitalisationModel[]> {
    return this.getAll();
  }
}