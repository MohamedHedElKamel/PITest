import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  HospitalisationService,
  HospitalisationModel,
  HospitalisationCreateDto,
} from '../services/hospitalisation.service';
import { PredictionService, PredictionDTO } from '../services/prediction';

@Component({
  selector: 'app-hospitalisation',
  standalone: false,
  templateUrl: './hospitalisation.html',
  styleUrl: './hospitalisation.css',
})
export class Hospitalisation implements OnInit {
  hospitalisations: HospitalisationModel[] = [];
  loading = false;
  error?: string;
  successMessage?: string;
  showStats = false;

  // ✅ NOTIFICATION CRITIQUE
  criticalNotification: string | null = null;

  // ✅ PROPRIÉTÉS POUR LA VALIDATION DES DATES
  dateErrors: { [key: string]: string } = {};

  editMode: 'create' | 'edit' = 'create';
  selectedForEdit: HospitalisationModel | null = null;
  form: HospitalisationCreateDto = {
    reason: '',
    admissionDate: '',
    dischargeDate: null,
    room: '',
    status: '',
  };
  showForm = false;

  // Pour l'affichage des daily reports
  expandedId: number | null = null;
  showAllReports = false;

  // ✅ NOUVELLES PROPRIÉTÉS POUR LES PRÉDICTIONS
  predictions: { [key: number]: PredictionDTO } = {};
  predictionsLoading = false;
  showPredictions = false;

  constructor(
    private hospitalisationService: HospitalisationService,
    private predictionService: PredictionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('Component initialized');
    this.loadHospitalisations();
  }

  // ========== GETTER POUR LA DATE DU JOUR ==========
  get todayDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  loadHospitalisations(): void {
    this.loading = true;
    this.error = undefined;
    this.successMessage = undefined;
    console.log('Loading hospitalizations...');
    
    const timeoutId = setTimeout(() => {
      if (this.loading) {
        console.error('Request timeout - forcing loading to false');
        this.loading = false;
        this.error = 'La requête a pris trop de temps. Vérifiez que le serveur est accessible.';
        this.cdr.detectChanges();
      }
    }, 10000);
    
    this.hospitalisationService.getAll().subscribe({
      next: (data: HospitalisationModel[]) => {
        clearTimeout(timeoutId);
        console.log('Data received:', data);
        console.log('Number of items:', data.length);
        
        this.hospitalisations = (data || []).sort((a: HospitalisationModel, b: HospitalisationModel) => 
          new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime()
        );
        
        this.loading = false;
        this.checkCriticalStatus();
        
        this.cdr.detectChanges();
        console.log('After setting - hospitalisations:', this.hospitalisations);
        console.log('After setting - loading:', this.loading);
      },
      error: (err: any) => {
        clearTimeout(timeoutId);
        console.error('Erreur backend hospitalisation :', err);
        console.error('Error details:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          url: err.url
        });
        this.error = `Impossible de charger les hospitalisations. Erreur: ${err.status || 'Network'} - ${err.statusText || err.message}`;
        this.loading = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        clearTimeout(timeoutId);
        console.log('Request completed');
      }
    });
  }

  // ========== GESTION DES DAILY REPORTS ==========

  toggleReports(hospitalisationId: number): void {
    if (this.expandedId === hospitalisationId) {
      this.expandedId = null;
      console.log('Closing reports for hospitalisation:', hospitalisationId);
    } else {
      this.expandedId = hospitalisationId;
      console.log('Opening reports for hospitalisation:', hospitalisationId);
      console.log('Daily reports:', this.getDailyReports(hospitalisationId));
    }
    this.cdr.detectChanges();
  }

  getDailyReports(hospitalisationId: number): any[] {
    const hospitalisation = this.hospitalisations.find((h: HospitalisationModel) => h.idHospitalization === hospitalisationId);
    return hospitalisation?.dailyReports || [];
  }

  hasDailyReports(hospitalisationId: number): boolean {
    const reports = this.getDailyReports(hospitalisationId);
    return reports && reports.length > 0;
  }

  countDailyReports(hospitalisationId: number): number {
    return this.getDailyReports(hospitalisationId).length;
  }

  getLatestDailyReport(hospitalisationId: number): any | null {
    const reports = this.getDailyReports(hospitalisationId);
    if (reports.length === 0) return null;
    
    return reports.sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR');
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getTotalReportsCount(): number {
    return this.hospitalisations.reduce((total: number, h: HospitalisationModel) => 
      total + (h.dailyReports?.length || 0), 0
    );
  }

  // ========== FONCTIONNALITÉ TIMELINE ==========

  getReportsTimeline(hospitalisationId: number): any[] {
    const reports = this.getDailyReports(hospitalisationId);
    const timeline = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dateStr = date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit'
      });
      
      const count = reports.filter((r: any) => {
        const reportDate = new Date(r.date);
        return reportDate.toDateString() === date.toDateString();
      }).length;
      
      const bars = '●'.repeat(count) + '○'.repeat(10 - Math.min(count, 10));
      
      timeline.push({
        date: dateStr,
        count: count,
        bars: bars,
        hasReports: count > 0
      });
    }
    
    return timeline;
  }

  getAverageReportsPerDay(hospitalisationId: number): number {
    const reports = this.getDailyReports(hospitalisationId);
    if (reports.length === 0) return 0;
    
    const firstReportDate = new Date(Math.min(
      ...reports.map((r: any) => new Date(r.date).getTime())
    ));
    
    const today = new Date();
    const daysDiff = Math.ceil(
      (today.getTime() - firstReportDate.getTime()) / (1000 * 3600 * 24)
    ) + 1;
    
    return Math.round((reports.length / daysDiff) * 10) / 10;
  }

  // ========== MÉTHODES POUR LES PRÉDICTIONS ==========

  /**
   * Bascule l'affichage des prédictions
   */
  togglePredictions(): void {
    this.showPredictions = !this.showPredictions;
    if (this.showPredictions) {
      this.loadPredictions();
    }
  }

  /**
   * Charge toutes les prédictions
   */
  loadPredictions(): void {
    this.predictionsLoading = true;
    
    this.predictionService.getAllPredictions().subscribe({
      next: (data: PredictionDTO[]) => {
        // Transformer le tableau en dictionnaire indexé par ID
        this.predictions = {};
        data.forEach((p: PredictionDTO) => {
          this.predictions[p.hospitalizationId] = p;
        });
        this.predictionsLoading = false;
        console.log('✅ Prédictions chargées:', data);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ Erreur chargement prédictions:', err);
        this.predictionsLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Retourne le nombre de prédictions chargées
   */
  getPredictionsCount(): number {
    return Object.keys(this.predictions).length;
  }

  /**
   * Formate la date prédite pour l'affichage
   */
  formatPredictedDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Retourne la classe CSS selon le niveau de confiance
   */
  getConfidenceClass(confidence: number): string {
    if (confidence >= 80) return 'confidence-high';
    if (confidence >= 50) return 'confidence-medium';
    return 'confidence-low';
  }

  // ========== ALERTE CRITIQUE ==========

  checkCriticalStatus(): void {
    this.criticalNotification = null;
    
    const criticalPatients = this.hospitalisations.filter((h: HospitalisationModel) => h.status === 'CRITICAL');
    
    if (criticalPatients.length > 0) {
      const rooms = criticalPatients.map((p: HospitalisationModel) => p.room).join(', ');
      
      if (criticalPatients.length === 1) {
        this.criticalNotification = `🚨 PATIENT EN ÉTAT CRITIQUE : Chambre ${rooms}`;
      } else {
        this.criticalNotification = `🚨 PATIENTS EN ÉTAT CRITIQUE : Chambres ${rooms}`;
      }
      
      console.log('⚠️ Alerte critique:', this.criticalNotification);
      
      setTimeout(() => {
        this.criticalNotification = null;
        this.cdr.detectChanges();
        console.log('🔔 Notification critique effacée');
      }, 7000);
      
      this.cdr.detectChanges();
    }
  }

  // ========== VALIDATION DES DATES ==========

  validateDates(): boolean {
    this.dateErrors = {};
    let isValid = true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const admissionDate = new Date(this.form.admissionDate);
    admissionDate.setHours(0, 0, 0, 0);
    
    if (admissionDate < today) {
      this.dateErrors['admissionDate'] = 'La date d\'admission ne peut pas être dans le passé';
      isValid = false;
      console.log('❌ Erreur admissionDate:', this.dateErrors['admissionDate']);
    }
    
    if (this.form.dischargeDate) {
      const dischargeDate = new Date(this.form.dischargeDate);
      dischargeDate.setHours(0, 0, 0, 0);
      
      if (dischargeDate < admissionDate) {
        this.dateErrors['dischargeDate'] = 'La date de sortie doit être postérieure à la date d\'admission';
        isValid = false;
        console.log('❌ Erreur dischargeDate:', this.dateErrors['dischargeDate']);
      }
    }
    
    return isValid;
  }

  // ========== MÉTHODES CRUD ==========

  startCreate(): void {
    this.editMode = 'create';
    this.selectedForEdit = null;
    this.form = {
      reason: '',
      admissionDate: this.todayDate,
      dischargeDate: null,
      room: '',
      status: 'STABLE',
    };
    this.dateErrors = {};
    this.showForm = true;
    this.error = undefined;
    this.successMessage = undefined;
  }

  startEdit(h: HospitalisationModel): void {
    this.editMode = 'edit';
    this.selectedForEdit = h;
    this.form = {
      reason: h.reason,
      admissionDate: h.admissionDate?.slice(0, 10) ?? '',
      dischargeDate: h.dischargeDate ? h.dischargeDate.slice(0, 10) : null,
      room: h.room,
      status: h.status,
    };
    this.dateErrors = {};
    this.showForm = true;
    this.error = undefined;
    this.successMessage = undefined;
  }

  cancelForm(): void {
    this.showForm = false;
    this.selectedForEdit = null;
    this.error = undefined;
    this.successMessage = undefined;
    this.dateErrors = {};
  }

  save(): void {
    if (!this.form.reason || !this.form.room || !this.form.admissionDate) {
      this.error = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }
    
    if (!this.validateDates()) {
      this.error = 'Veuillez corriger les erreurs de dates.';
      return;
    }

    if (this.editMode === 'create') {
      console.log('Creating hospitalization:', this.form);
      this.hospitalisationService.create(this.form).subscribe({
        next: (response: HospitalisationModel) => {
          console.log('Create response:', response);
          this.successMessage = 'Hospitalisation créée avec succès!';
          this.showForm = false;
          this.loadHospitalisations();
          this.cdr.detectChanges();
          setTimeout(() => {
            this.successMessage = undefined;
            this.cdr.detectChanges();
          }, 3000);
        },
        error: (err: any) => {
          console.error('Erreur création', err);
          this.error = 'Erreur lors de la création. Vérifiez votre connexion au serveur.';
          this.cdr.detectChanges();
        },
      });
    } else if (this.selectedForEdit) {
      const payload: HospitalisationModel = {
        ...this.form,
        idHospitalization: this.selectedForEdit.idHospitalization,
      };
      console.log('Updating hospitalization:', payload);
      this.hospitalisationService.update(payload).subscribe({
        next: (response: HospitalisationModel) => {
          console.log('Update response:', response);
          this.successMessage = 'Hospitalisation modifiée avec succès!';
          this.showForm = false;
          this.loadHospitalisations();
          this.cdr.detectChanges();
          setTimeout(() => {
            this.successMessage = undefined;
            this.cdr.detectChanges();
          }, 3000);
        },
        error: (err: any) => {
          console.error('Erreur mise à jour', err);
          this.error = 'Erreur lors de la modification.';
          this.cdr.detectChanges();
        },
      });
    }
  }

  delete(h: HospitalisationModel): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette hospitalisation ?')) return;
    console.log('Deleting hospitalization:', h.idHospitalization);
    this.hospitalisationService.delete(h.idHospitalization).subscribe({
      next: () => {
        console.log('Delete successful');
        this.successMessage = 'Hospitalisation supprimée avec succès!';
        this.loadHospitalisations();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.successMessage = undefined;
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err: any) => {
        console.error('Erreur suppression', err);
        this.error = 'Erreur lors de la suppression.';
        this.cdr.detectChanges();
      },
    });
  }

  trackByIdHospitalization(index: number, item: HospitalisationModel): number {
    return item.idHospitalization;
  }
}