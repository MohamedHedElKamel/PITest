import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PredictionDTO {
    hospitalizationId: number;
    predictedRemainingDays: number;
    confidence: number;
    message: string;
    predictedDischargeDate: string; // Format: YYYY-MM-DD
}

@Injectable({
    providedIn: 'root'
})
export class PredictionService {
    
    // Via API Gateway
    private apiUrl = 'http://localhost:8093/hospitalization';

    constructor(private http: HttpClient) { }

    /**
     * Récupère la prédiction pour une hospitalisation spécifique
     * GET /hospitalization/{id}/prediction
     */
    getPredictionForHospitalization(id: number): Observable<PredictionDTO> {
        console.log(`🔮 Récupération prédiction pour hospitalisation #${id}`);
        return this.http.get<PredictionDTO>(`${this.apiUrl}/${id}/prediction`);
    }

    /**
     * Récupère les prédictions pour toutes les hospitalisations actives
     * GET /hospitalization/predictions/all
     */
    getAllPredictions(): Observable<PredictionDTO[]> {
        console.log('🔮 Récupération de toutes les prédictions');
        return this.http.get<PredictionDTO[]>(`${this.apiUrl}/predictions/all`);
    }

    /**
     * Récupère le résumé des prédictions (texte simple)
     * GET /hospitalization/predictions/summary
     */
    getPredictionsSummary(): Observable<string> {
        console.log('📊 Récupération du résumé des prédictions');
        return this.http.get(`${this.apiUrl}/predictions/summary`, { responseType: 'text' });
    }
}