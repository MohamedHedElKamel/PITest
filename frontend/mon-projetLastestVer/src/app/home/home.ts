import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  standalone: false
})
export class Home implements OnInit {
  // Header UI state
  showNotifications = false;
  showProfile = false;
  unreadNotifications = 2;

  notifications = [
    { icon: '📅', title: 'Upcoming appointment tomorrow at 09:00', time: '1h ago' },
    { icon: '🧪', title: 'New lab result available', time: '3h ago' }
  ];

  // Modals visibility
  showAppointmentForm = false;
  showEmergencyForm = false;
  showMedicalReportForm = false;
  showLabResultForm = false;
  showTreatmentForm = false;

  // Dossiers & follow-ups
  loading = false;
  error: string | null = null;
  dossiers: any[] = [];

  expandedPatients: { [id: number]: boolean } = {};
  loadingSuivis: { [id: number]: boolean } = {};
  dossierSuivis: { [id: number]: any[] } = {};
  suiviImages: { [id: number]: any[] } = {};

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Pour l’instant on ne charge pas encore les vrais dossiers backend.
    // Tu pourras brancher ici un appel HTTP plus tard.
    this.loadDossiers();
  }

  // ---------- Header actions ----------
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.unreadNotifications = 0;
    }
  }

  toggleProfile(): void {
    this.showProfile = !this.showProfile;
  }

  // ---------- Appointment form ----------
  openAppointmentForm(): void {
    this.showAppointmentForm = true;
  }

  closeAppointmentForm(): void {
    this.showAppointmentForm = false;
  }

  onSubmitAppointment(form: NgForm): void {
    if (form.valid) {
      console.log('Appointment form submitted', form.value);
      this.closeAppointmentForm();
      form.resetForm();
    }
  }

  // ---------- Emergency form ----------
  openEmergencyForm(): void {
    this.showEmergencyForm = true;
  }

  closeEmergencyForm(): void {
    this.showEmergencyForm = false;
  }

  onSubmitEmergency(form: NgForm): void {
    if (form.valid) {
      console.log('Emergency form submitted', form.value);
      this.closeEmergencyForm();
      form.resetForm();
    }
  }

  // ---------- Medical report form ----------
  openMedicalReportForm(): void {
    this.showMedicalReportForm = true;
  }

  closeMedicalReportForm(): void {
    this.showMedicalReportForm = false;
  }

  onSubmitMedicalReport(form: NgForm): void {
    if (form.valid) {
      console.log('Medical report form submitted', form.value);
      this.closeMedicalReportForm();
      form.resetForm();
    }
  }

  // ---------- Lab results form ----------
  openLabResultForm(): void {
    this.showLabResultForm = true;
  }

  closeLabResultForm(): void {
    this.showLabResultForm = false;
  }

  onSubmitLabResult(form: NgForm): void {
    if (form.valid) {
      console.log('Lab result form submitted', form.value);
      this.closeLabResultForm();
      form.resetForm();
    }
  }

  // ---------- Treatment form ----------
  openTreatmentForm(): void {
    this.showTreatmentForm = true;
  }

  closeTreatmentForm(): void {
    this.showTreatmentForm = false;
  }

  onSubmitTreatment(form: NgForm): void {
    if (form.valid) {
      console.log('Treatment form submitted', form.value);
      this.closeTreatmentForm();
      form.resetForm();
    }
  }

  // ---------- Dossiers & suivis (placeholder logique) ----------
  loadDossiers(): void {
    // Placeholder : pour l’instant, pas d’appel HTTP réel.
    this.loading = false;
    this.error = null;
    this.dossiers = [];
  }

  formatDate(value: string | Date | null | undefined): string {
    if (!value) {
      return '-';
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
  }

  formatDateFull(value: string | Date | null | undefined): string {
    if (!value) {
      return '-';
    }
    const d = new Date(value);
    return isNaN(d.getTime()) ? '-' : d.toLocaleString();
  }

  togglePatient(id: number): void {
    this.expandedPatients[id] = !this.expandedPatients[id];
  }

  loadSuivisForDossier(id: number): void {
    this.loadingSuivis[id] = true;
    // Placeholder: ici tu pourras appeler ton backend pour charger les suivis.
    setTimeout(() => {
      this.dossierSuivis[id] = this.dossierSuivis[id] ?? [];
      this.loadingSuivis[id] = false;
    }, 500);
  }

  getStatusClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('stable') || s.includes('good')) {
      return 'status-good';
    }
    if (s.includes('warning')) {
      return 'status-warning';
    }
    if (s.includes('critical') || s.includes('bad')) {
      return 'status-bad';
    }
    return 'status-unknown';
  }

  getStatusIcon(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('stable') || s.includes('good')) {
      return '✅';
    }
    if (s.includes('warning')) {
      return '⚠️';
    }
    if (s.includes('critical') || s.includes('bad')) {
      return '🚨';
    }
    return 'ℹ️';
  }

  getStatusLabel(status: string): string {
    return status || 'Unknown';
  }

  viewImage(image: any): void {
    console.log('View image', image);
  }

  getImageUrl(path: string): string {
    return path || 'assets/img/placeholder.png';
  }

  getImageTypeLabel(type: string | null | undefined): string {
    if (!type) {
      return 'Image';
    }
    return type;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/img/placeholder.png';
  }

  // ---------- Actions sur le dossier ----------
  openSuiviPopup(dossier: any): void {
    console.log('Open suivi popup for dossier', dossier);
  }

  viewFullDossier(id: number): void {
    console.log('View full dossier', id);
  }
}