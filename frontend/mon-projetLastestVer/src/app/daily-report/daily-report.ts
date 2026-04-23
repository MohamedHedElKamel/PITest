import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { DailyReportService, DailyReportModel, DailyReportCreateDto } from '../services/daily-report.service';

@Component({
  selector: 'app-daily-report',
  standalone: false,
  templateUrl: './daily-report.html',
  styleUrl: './daily-report.css',
})
export class DailyReport implements OnInit, OnChanges {
  // Propriétés d'entrée
  @Input() reports: DailyReportModel[] = [];
  @Input() hospitalisationId?: number;
  @Input() maxReports?: number;
  
  // Événement de sortie pour notifier le parent des changements
  @Output() reportsChanged = new EventEmitter<void>();

  // Propriétés locales
  filteredReports: DailyReportModel[] = [];
  loading = false;
  error?: string;
  successMessage?: string;
  expandedStates: { [key: number]: boolean } = {};

  // ========== PROPRIÉTÉS POUR LE FORMULAIRE ==========
  showFormModal = false;
  formMode: 'create' | 'edit' = 'create';
  currentReport: DailyReportModel | null = null;
  
  // Formulaire
  formData: DailyReportCreateDto = {
    date: this.getCurrentDateTime(),
    observation: '',
    hospitalizationId: 0
  };

  // Validation
  formErrors: { [key: string]: string } = {};
  isSubmitting = false;

  // ========== CONFIRMATION SUPPRESSION ==========
  showDeleteConfirm = false;
  reportToDelete: DailyReportModel | null = null;

  // ========== FONCTIONNALITÉ 2 : RAPPORT MANQUANT ==========
  missingTodayReport: boolean = false;

  constructor(
    private dailyReportService: DailyReportService,
    private cdr: ChangeDetectorRef  // ✅ AJOUT IMPORTANT
  ) {}

  ngOnInit(): void {
    console.log('DailyReport initialized with reports:', this.reports);
    
    if (!this.reports || this.reports.length === 0) {
      if (this.hospitalisationId) {
        this.loadReports();
      }
    } else {
      this.processReports();
      this.checkTodayReport();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reports'] && changes['reports'].currentValue) {
      this.processReports();
      this.checkTodayReport();
    }
  }

  /**
   * Charge les reports depuis le service
   */
  private loadReports(): void {
    if (!this.hospitalisationId) {
      this.error = 'ID hospitalisation manquant';
      return;
    }

    this.loading = true;
    this.error = undefined;

    this.dailyReportService.getByHospitalisation(this.hospitalisationId).subscribe({
      next: (data) => {
        this.reports = data;
        this.processReports();
        this.loading = false;
        this.checkTodayReport();
        this.cdr.detectChanges(); // ✅ Force la mise à jour
        console.log(`✅ Reports chargés pour hospitalisation #${this.hospitalisationId}:`, data.length);
      },
      error: (err) => {
        console.error('❌ Erreur chargement reports:', err);
        this.error = 'Impossible de charger les daily reports.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Traite et trie les reports
   */
  private processReports(): void {
    let sorted = [...this.reports].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (this.maxReports && this.maxReports > 0) {
      sorted = sorted.slice(0, this.maxReports);
    }

    this.filteredReports = sorted;
  }

  /**
   * Rafraîchit les reports
   */
  refresh(): void {
    console.log('🔄 Rafraîchissement des reports...');
    
    if (this.hospitalisationId) {
      this.loading = true;
      this.error = undefined;
      
      this.dailyReportService.getByHospitalisation(this.hospitalisationId, true).subscribe({
        next: (data) => {
          this.reports = data;
          this.processReports();
          this.loading = false;
          this.checkTodayReport();
          this.cdr.detectChanges();
          console.log('✅ Reports rafraîchis:', data.length);
        },
        error: (err) => {
          console.error('❌ Erreur rafraîchissement reports:', err);
          this.error = 'Impossible de rafraîchir les reports.';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      console.warn('⚠️ Impossible de rafraîchir : hospitalisationId manquant');
    }
  }

  // ========== FONCTIONNALITÉ 2 : VÉRIFICATION RAPPORT MANQUANT ==========

  /**
   * Vérifie si un rapport a été ajouté aujourd'hui
   */
  checkTodayReport(): void {
    if (!this.hospitalisationId || !this.reports || this.reports.length === 0) {
      this.missingTodayReport = true;
      console.log(`⚠️ Aucun rapport - missingTodayReport = true`);
      return;
    }
    
    const today = new Date();
    const todayString = today.toDateString();
    
    const hasTodayReport = this.reports.some(report => {
      const reportDate = new Date(report.date);
      return reportDate.toDateString() === todayString;
    });
    
    this.missingTodayReport = !hasTodayReport;
    
    if (this.missingTodayReport) {
      console.log(`⚠️ Aucun rapport aujourd'hui pour hospitalisation #${this.hospitalisationId}`);
    } else {
      console.log(`✅ Rapport trouvé aujourd'hui pour hospitalisation #${this.hospitalisationId}`);
    }
  }

  // ========== MÉTHODES CRUD ==========

  /**
   * Ouvre le formulaire de création
   */
  openCreateForm(): void {
    console.log('📝 Création pour hospitalisation #', this.hospitalisationId);
    
    this.formMode = 'create';
    this.currentReport = null;
    
    if (!this.hospitalisationId) {
      console.error('❌ ERREUR: hospitalisationId est manquant!');
      this.error = 'Impossible de créer un rapport: ID hospitalisation manquant';
      return;
    }
    
    this.formData = {
      date: this.getCurrentDateTime(),
      observation: '',
      hospitalizationId: this.hospitalisationId
    };
    
    console.log('📋 Formulaire initialisé avec:', this.formData);
    this.formErrors = {};
    this.showFormModal = true;
  }

  /**
   * Ouvre le formulaire d'édition
   */
  openEditForm(report: DailyReportModel): void {
    console.log('✏️ Modification report #', report.idReport, 'pour hospitalisation #', this.hospitalisationId);
    
    this.formMode = 'edit';
    this.currentReport = report;
    
    const reportDate = new Date(report.date);
    const formattedDate = this.formatDateForInput(reportDate);
    
    this.formData = {
      date: formattedDate,
      observation: report.observation,
      hospitalizationId: report.hospitalizationId || this.hospitalisationId || 0
    };
    
    console.log('📋 Formulaire d\'édition:', this.formData);
    this.formErrors = {};
    this.showFormModal = true;
  }

  /**
   * Ferme le formulaire
   */
  closeFormModal(): void {
    console.log('🔒 Fermeture du modal');
    this.showFormModal = false;
    this.formErrors = {};
    this.isSubmitting = false;
    this.error = undefined;
    this.cdr.detectChanges();
  }

  /**
   * Valide le formulaire
   */
  validateForm(): boolean {
    this.formErrors = {};
    let isValid = true;

    if (!this.formData.date) {
      this.formErrors['date'] = 'La date est requise';
      isValid = false;
    }

    if (!this.formData.observation || this.formData.observation.trim() === '') {
      this.formErrors['observation'] = 'L\'observation est requise';
      isValid = false;
    } else if (this.formData.observation.length < 10) {
      this.formErrors['observation'] = 'L\'observation doit contenir au moins 10 caractères';
      isValid = false;
    } else if (this.formData.observation.length > 500) {
      this.formErrors['observation'] = 'L\'observation ne peut pas dépasser 500 caractères';
      isValid = false;
    }

    if (!this.formData.hospitalizationId || this.formData.hospitalizationId <= 0) {
      this.formErrors['hospitalizationId'] = 'ID hospitalisation invalide';
      isValid = false;
    }

    return isValid;
  }

  /**
   * ✅ Sauvegarde le report - VERSION CORRIGÉE
   */
  saveReport(): void {
    if (!this.validateForm()) {
      return;
    }

    console.log('📝 Soumission formulaire - Mode:', this.formMode);
    this.isSubmitting = true;
    this.error = undefined;

    const timeoutId = setTimeout(() => {
      if (this.isSubmitting) {
        console.warn('⏱️ Timeout de sécurité déclenché');
        this.isSubmitting = false;
        this.showFormModal = false;
        this.error = 'La requête a pris trop de temps. Vérifiez votre connexion.';
        this.cdr.detectChanges();
      }
    }, 10000);

    if (this.formMode === 'create') {
      console.log('🚀 Création report avec payload:', this.formData);
      
      this.dailyReportService.create(this.formData).subscribe({
        next: (newReport) => {
          clearTimeout(timeoutId);
          console.log('✅ CRÉATION RÉUSSIE:', newReport);
          
          // ✅ 1. Message de succès
          this.successMessage = 'Rapport ajouté avec succès';
          
          // ✅ 2. FERMER IMMÉDIATEMENT LE MODAL
          this.showFormModal = false;
          this.isSubmitting = false;
          this.formErrors = {};
          
          // ✅ 3. Forcer la mise à jour de l'UI
          this.cdr.detectChanges();
          
          // ✅ 4. Effacer le message après 3 secondes
          setTimeout(() => {
            this.successMessage = undefined;
            this.cdr.detectChanges();
          }, 3000);
          
          // ✅ 5. Recharger les reports en ARRIÈRE-PLAN
          if (this.hospitalisationId) {
            console.log('🔄 Rechargement en arrière-plan...');
            this.dailyReportService.getByHospitalisation(this.hospitalisationId, true).subscribe({
              next: (data) => {
                this.reports = data;
                this.processReports();
                this.checkTodayReport();
                this.reportsChanged.emit();
                this.cdr.detectChanges();
                console.log('✅ Reports rechargés:', data.length);
              },
              error: (err) => {
                console.error('❌ Erreur rechargement:', err);
              }
            });
          }
          
          console.log('✅ Processus de création terminé - MODAL FERMÉ');
        },
        error: (err) => {
          clearTimeout(timeoutId);
          console.error('❌ Erreur création:', err);
          this.error = 'Erreur lors de la création du rapport';
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      if (!this.currentReport) return;
      
      const updatePayload: DailyReportModel = {
        idReport: this.currentReport.idReport,
        date: this.formData.date,
        observation: this.formData.observation,
        hospitalizationId: this.formData.hospitalizationId
      };

      console.log('✏️ Modification report avec payload:', updatePayload);
      
      this.dailyReportService.update(updatePayload).subscribe({
        next: (updatedReport) => {
          clearTimeout(timeoutId);
          console.log('✅ MODIFICATION RÉUSSIE:', updatedReport);
          
          // ✅ 1. Message de succès
          this.successMessage = 'Rapport modifié avec succès';
          
          // ✅ 2. FERMER IMMÉDIATEMENT LE MODAL
          this.showFormModal = false;
          this.isSubmitting = false;
          this.formErrors = {};
          
          // ✅ 3. Forcer la mise à jour de l'UI
          this.cdr.detectChanges();
          
          // ✅ 4. Effacer le message après 3 secondes
          setTimeout(() => {
            this.successMessage = undefined;
            this.cdr.detectChanges();
          }, 3000);
          
          // ✅ 5. Recharger les reports en ARRIÈRE-PLAN
          if (this.hospitalisationId) {
            console.log('🔄 Rechargement en arrière-plan après modification...');
            this.dailyReportService.getByHospitalisation(this.hospitalisationId, true).subscribe({
              next: (data) => {
                this.reports = data;
                this.processReports();
                this.checkTodayReport();
                this.reportsChanged.emit();
                this.cdr.detectChanges();
                console.log('✅ Reports rechargés:', data.length);
              },
              error: (err) => {
                console.error('❌ Erreur rechargement:', err);
              }
            });
          }
          
          console.log('✅ Processus de modification terminé - MODAL FERMÉ');
        },
        error: (err) => {
          clearTimeout(timeoutId);
          console.error('❌ Erreur modification:', err);
          this.error = 'Erreur lors de la modification du rapport';
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  /**
   * Ouvre la confirmation de suppression
   */
  confirmDelete(report: DailyReportModel): void {
    console.log('🗑️ Confirmation suppression report #', report.idReport);
    this.reportToDelete = report;
    this.showDeleteConfirm = true;
  }

  /**
   * Annule la suppression
   */
  cancelDelete(): void {
    console.log('❌ Suppression annulée');
    this.showDeleteConfirm = false;
    this.reportToDelete = null;
  }

  /**
   * Supprime le report
   */
  deleteReport(): void {
    if (!this.reportToDelete) return;

    console.log('🗑️ Suppression report #', this.reportToDelete.idReport);
    this.isSubmitting = true;
    
    this.dailyReportService.delete(this.reportToDelete.idReport).subscribe({
      next: () => {
        console.log('✅ SUPPRESSION RÉUSSIE');
        this.showSuccess('Rapport supprimé avec succès');
        this.cancelDelete();
        
        if (this.hospitalisationId) {
          console.log('🔄 Rechargement des reports après suppression');
          this.loadReports();
        }
        
        this.reportsChanged.emit();
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('❌ Erreur suppression:', err);
        this.error = 'Erreur lors de la suppression du rapport';
        this.isSubmitting = false;
        this.cancelDelete();
      }
    });
  }

  // ========== MÉTHODES UTILITAIRES ==========

  /**
   * Affiche un message de succès
   */
  private showSuccess(message: string): void {
    this.successMessage = message;
    console.log('✅ Message de succès:', message);
    setTimeout(() => {
      this.successMessage = undefined;
      console.log('🕒 Message de succès effacé');
    }, 3000);
  }

  /**
   * Retourne la date/heure actuelle au format datetime-local
   */
  private getCurrentDateTime(): string {
    const now = new Date();
    return this.formatDateForInput(now);
  }

  /**
   * Formate une date pour l'input datetime-local
   */
  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  /**
   * Vérifie si des reports existent
   */
  hasReports(): boolean {
    return this.filteredReports && this.filteredReports.length > 0;
  }

  /**
   * Compte le nombre de reports
   */
  getReportsCount(): number {
    return this.filteredReports?.length || 0;
  }

  /**
   * Bascule l'expansion d'un report
   */
  toggleReportExpansion(reportId: number): void {
    this.expandedStates[reportId] = !this.expandedStates[reportId];
  }

  /**
   * Vérifie si un report est expansé
   */
  isReportExpanded(reportId: number): boolean {
    return !!this.expandedStates[reportId];
  }

  /**
   * Formate la date
   */
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formate l'heure
   */
  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Aperçu de l'observation
   */
  getObservationPreview(observation: string, maxLength: number = 100): string {
    if (!observation) return '';
    if (observation.length <= maxLength) return observation;
    return observation.substring(0, maxLength) + '...';
  }

  /**
   * TrackBy pour optimisation
   */
  trackByReportId(index: number, report: DailyReportModel): number {
    return report.idReport;
  }
}