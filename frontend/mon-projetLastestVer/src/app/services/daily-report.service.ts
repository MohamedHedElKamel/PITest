import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, shareReplay, catchError, tap } from 'rxjs/operators';

/** Aligné avec DailyReportDTO (idReport) et Hospitalization (idHospitalization) */
export interface DailyReportModel {
  idReport: number;
  date: string;
  observation: string;
  hospitalizationId?: number;
}

export type DailyReportCreateDto = Omit<DailyReportModel, 'idReport'>;

@Injectable({
  providedIn: 'root',
})
export class DailyReportService {
  private readonly baseUrl = 'http://localhost:8093/dailyReport';
  
  // Cache avec undefined au lieu de null
  private reportsCache: DailyReportModel[] | undefined;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 secondes

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les daily reports
   */
  getAll(forceRefresh: boolean = false): Observable<DailyReportModel[]> {
    const now = Date.now();
    
    if (!forceRefresh && this.reportsCache && (now - this.lastFetch) < this.CACHE_DURATION) {
      console.log('📦 Utilisation du cache daily reports:', this.reportsCache.length, 'items');
      return of([...this.reportsCache]);
    }

    console.log('🌐 Chargement daily reports depuis API...');
    return this.http.get<DailyReportModel[]>(`${this.baseUrl}/all`).pipe(
      map(reports => {
        const sorted = reports.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        this.reportsCache = sorted;
        this.lastFetch = now;
        console.log('✅ Daily reports chargés:', sorted.length);
        
        return sorted;
      }),
      shareReplay(1),
      catchError(error => {
        console.error('❌ Erreur getAll daily reports:', error);
        this.reportsCache = undefined;
        throw error;
      })
    );
  }

  /**
   * Récupère les daily reports pour une hospitalisation
   */
  getByHospitalisation(hospitalisationId: number, forceRefresh: boolean = false): Observable<DailyReportModel[]> {
    if (!forceRefresh && this.reportsCache && (Date.now() - this.lastFetch) < this.CACHE_DURATION) {
      const filtered = this.reportsCache.filter(r => r.hospitalizationId === hospitalisationId);
      console.log(`📦 Cache: ${filtered.length} reports pour hospitalisation #${hospitalisationId}`);
      return of([...filtered]);
    }

    return this.getAll(forceRefresh).pipe(
      map(reports => {
        const filtered = reports.filter(r => r.hospitalizationId === hospitalisationId);
        console.log(`🌐 API: ${filtered.length} reports pour hospitalisation #${hospitalisationId}`);
        return filtered;
      })
    );
  }

  /**
   * Récupère le dernier daily report
   */
  getLatestForHospitalisation(hospitalisationId: number): Observable<DailyReportModel | undefined> {
    return this.getByHospitalisation(hospitalisationId).pipe(
      map(reports => reports.length > 0 ? reports[0] : undefined)
    );
  }

  /**
   * Compte le nombre de daily reports
   */
  countByHospitalisation(hospitalisationId: number): Observable<number> {
    return this.getByHospitalisation(hospitalisationId).pipe(
      map(reports => reports.length)
    );
  }

  /**
   * Vérifie si des reports existent
   */
  hasReports(hospitalisationId: number): Observable<boolean> {
    return this.countByHospitalisation(hospitalisationId).pipe(
      map(count => count > 0)
    );
  }

  /**
   * Crée un nouveau daily report
   * AVEC LOGS DE DÉBOGAGE AMÉLIORÉS
   */
  create(payload: DailyReportCreateDto): Observable<DailyReportModel> {
    // Log 1: Ce qui est envoyé
    console.log('🚀 [CREATE] Envoi création report:', {
      ...payload,
      date: payload.date,
      observation: payload.observation?.substring(0, 50) + (payload.observation?.length > 50 ? '...' : ''),
      hospitalizationId: payload.hospitalizationId
    });

    const formattedPayload = {
      ...payload,
      date: this.formatDate(payload.date)
    };

    console.log('📤 [CREATE] URL:', `${this.baseUrl}/add`);
    console.log('📤 [CREATE] Payload formaté:', formattedPayload);

    return this.http.post<DailyReportModel>(`${this.baseUrl}/add`, formattedPayload).pipe(
      tap(response => {
        // Log 2: Réponse reçue
        console.log('✅ [CREATE] Réception réponse:', {
          idReport: response.idReport,
          date: response.date,
          observation: response.observation?.substring(0, 50) + (response.observation?.length > 50 ? '...' : ''),
          hospitalizationId: response.hospitalizationId
        });
      }),
      map(newReport => {
        this.invalidateCache();
        console.log('🔄 [CREATE] Cache invalidé après création');
        return newReport;
      }),
      catchError(error => {
        // Log 3: Erreur détaillée
        console.error('❌ [CREATE] Erreur HTTP détaillée:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          url: error.url,
          error: error.error, // Réponse d'erreur du backend
          headers: error.headers?.keys()
        });

        // Log supplémentaire pour les erreurs de validation
        if (error.status === 400) {
          console.error('📋 [CREATE] Erreur de validation - Vérifiez le format des données');
        } else if (error.status === 404) {
          console.error('🔍 [CREATE] URL incorrecte:', `${this.baseUrl}/add`);
        } else if (error.status === 0) {
          console.error('🌐 [CREATE] Erreur réseau - Backend inaccessible ou CORS');
        }

        throw error;
      })
    );
  }

  /**
   * Met à jour un daily report
   */
  update(payload: DailyReportModel): Observable<DailyReportModel> {
    console.log('✏️ [UPDATE] Modification report #', payload.idReport);
    
    const formattedPayload = {
      ...payload,
      date: this.formatDate(payload.date)
    };

    return this.http.put<DailyReportModel>(`${this.baseUrl}/update`, formattedPayload).pipe(
      tap(updatedReport => {
        console.log('✅ [UPDATE] Report modifié:', updatedReport.idReport);
      }),
      map(updatedReport => {
        this.invalidateCache();
        return updatedReport;
      }),
      catchError(error => {
        console.error('❌ [UPDATE] Erreur:', error);
        throw error;
      })
    );
  }

  /**
   * Supprime un daily report
   */
  delete(id: number): Observable<void> {
    console.log('🗑️ [DELETE] Suppression report #', id);
    
    return this.http.delete<void>(`${this.baseUrl}/delete/${id}`).pipe(
      tap(() => {
        console.log('✅ [DELETE] Report supprimé #', id);
      }),
      map(() => {
        this.invalidateCache();
      }),
      catchError(error => {
        console.error('❌ [DELETE] Erreur:', error);
        throw error;
      })
    );
  }

  /**
   * Invalide le cache
   */
  invalidateCache(): void {
    this.reportsCache = undefined;
    this.lastFetch = 0;
    console.log('🔄 Cache invalidé');
  }

  /**
   * Rafraîchit les données
   */
  refresh(): Observable<DailyReportModel[]> {
    console.log('🔄 Rafraîchissement forcé des données');
    this.invalidateCache();
    return this.getAll(true);
  }

  /**
   * Formate la date
   */
  private formatDate(dateStr: string): string {
    if (!dateStr) return dateStr;
    if (dateStr.includes('T')) {
      return dateStr;
    }
    return `${dateStr}T00:00:00`;
  }
}