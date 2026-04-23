import { Component, OnInit } from '@angular/core';
import {
  HospitalisationModel,
  HospitalisationService,
  HospitalisationCreateDto
} from '../services/hospitalisation.service';
import {
  DailyReportModel,
  DailyReportService,
  DailyReportCreateDto
} from '../services/daily-report.service';

@Component({
  selector: 'app-back',
  standalone: false,
  templateUrl: './back.html',
  styleUrl: './back.css',
})
export class Back implements OnInit {
  notifications = 3;

  doctor = {
    name: 'Dr. Sarah Dupont',
    role: 'Néphrologue',
    initials: 'SD'
  };

  // État hospitalisations
  hospitalisations: HospitalisationModel[] = [];
  selectedHospitalisation?: HospitalisationModel;
  hospitalisationLoading = false;
  hospitalisationError?: string;

  // Formulaire hospitalisation
  editMode: 'create' | 'edit' = 'create';
  formHospitalisation: HospitalisationCreateDto = {
    admissionDate: '',
    dischargeDate: null,
    room: '',
    status: '',
    reason: '',
  };

  // État daily reports pour l’hospitalisation sélectionnée
  dailyReports: DailyReportModel[] = [];
  dailyReportsLoading = false;
  dailyReportsError?: string;

  formDailyReport: DailyReportCreateDto = {
    date: '',
    observation: '',
    hospitalizationId: undefined  // ← Changé de idHospitalization à hospitalizationId
  };

  constructor(
    private hospitalisationService: HospitalisationService,
    private dailyReportService: DailyReportService
  ) {}

  ngOnInit(): void {
    this.loadHospitalisations();
  }

  // ---------- Hospitalisations ----------
  loadHospitalisations(): void {
    this.hospitalisationLoading = true;
    this.hospitalisationError = undefined;

    this.hospitalisationService.getAll().subscribe({
      next: (data) => {
        this.hospitalisations = data;
        this.hospitalisationLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement hospitalisations', err);
        this.hospitalisationError = 'Erreur lors du chargement des hospitalisations.';
        this.hospitalisationLoading = false;
      }
    });
  }

  selectHospitalisation(h: HospitalisationModel): void {
    this.selectedHospitalisation = h;
    this.formDailyReport = {
      date: '',
      observation: '',
      hospitalizationId: h.idHospitalization  // ← Changé
    };
    this.loadDailyReportsForSelected();
  }

  startCreateHospitalisation(): void {
    this.editMode = 'create';
    this.formHospitalisation = {
      admissionDate: new Date().toISOString().substring(0, 10),
      dischargeDate: null,
      room: '',
      status: 'STABLE',
      reason: '',
    };
  }

  startEditHospitalisation(h: HospitalisationModel): void {
    this.editMode = 'edit';
    this.selectedHospitalisation = h;
    this.formHospitalisation = {
      admissionDate: h.admissionDate,
      dischargeDate: h.dischargeDate,
      room: h.room,
      status: h.status,
      reason: h.reason,
    };
  }

  saveHospitalisation(): void {
    if (this.editMode === 'create') {
      this.hospitalisationService.create(this.formHospitalisation).subscribe({
        next: () => this.loadHospitalisations(),
        error: (err) => console.error('Erreur création hospitalisation', err)
      });
    } else if (this.editMode === 'edit' && this.selectedHospitalisation) {
      const payload = {
        ...this.formHospitalisation,
        idHospitalization: this.selectedHospitalisation.idHospitalization,  // ← Garder idHospitalization pour HospitalisationModel
      };
      this.hospitalisationService.update(payload).subscribe({
          next: () => this.loadHospitalisations(),
          error: (err) => console.error('Erreur mise à jour hospitalisation', err)
        });
    }
  }

  deleteHospitalisation(h: HospitalisationModel): void {
    if (!confirm('Supprimer cette hospitalisation ?')) {
      return;
    }
    this.hospitalisationService.delete(h.idHospitalization).subscribe({
      next: () => this.loadHospitalisations(),
      error: (err) => console.error('Erreur suppression hospitalisation', err)
    });
  }

  // ---------- Daily Reports ----------
  loadDailyReportsForSelected(): void {
    if (!this.selectedHospitalisation) {
      this.dailyReports = [];
      return;
    }

    this.dailyReportsLoading = true;
    this.dailyReportsError = undefined;

    this.dailyReportService
      .getByHospitalisation(this.selectedHospitalisation.idHospitalization)  // ← Utilise idHospitalization pour la méthode
      .subscribe({
        next: (data) => {
          this.dailyReports = data;
          this.dailyReportsLoading = false;
        },
        error: (err) => {
          console.error('Erreur chargement daily reports', err);
          this.dailyReportsError = 'Erreur lors du chargement des daily reports.';
          this.dailyReportsLoading = false;
        }
      });
  }

  saveDailyReport(): void {
    if (!this.selectedHospitalisation) {
      return;
    }
    
    // ✅ Correction : utiliser hospitalizationId (pas idHospitalization)
    this.formDailyReport.hospitalizationId = this.selectedHospitalisation.idHospitalization;

    console.log('📝 Sauvegarde daily report:', this.formDailyReport);

    this.dailyReportService.create(this.formDailyReport).subscribe({
      next: (newReport) => {
        console.log('✅ Daily report créé:', newReport);
        this.loadDailyReportsForSelected();
        // Réinitialiser le formulaire
        this.formDailyReport = {
          date: '',
          observation: '',
          hospitalizationId: this.selectedHospitalisation?.idHospitalization
        };
      },
      error: (err) => {
        console.error('❌ Erreur création daily report', err);
      }
    });
  }

  deleteDailyReport(report: DailyReportModel): void {
    if (!confirm('Supprimer ce daily report ?')) {
      return;
    }
    this.dailyReportService.delete(report.idReport).subscribe({
      next: () => {
        console.log('✅ Daily report supprimé');
        this.loadDailyReportsForSelected();
      },
      error: (err) => {
        console.error('❌ Erreur suppression daily report', err);
      }
    });
  }

  // ---------- Autres ----------
  logout(): void {
    console.log('Déconnexion');
  }
}