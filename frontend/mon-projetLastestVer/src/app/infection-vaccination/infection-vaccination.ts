import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthRoleService, PatientUser } from '../services/auth-role.service';
import {
  InfectionVaccinationService,
  Infection,
  Vaccination
} from '../services/infection-vaccination';

interface InteractionRule {
  vaccineA: string[];
  vaccineB: string[];
  minDaysBetween: number;
  severity: 'warning' | 'critical';
  reason: string;
}
interface ContraindicationRule {
  vaccineKeywords: string[];
  contraindications: { severities?: string[]; infectionKeywords?: string[] };
  severity: 'warning' | 'critical';
  message: string;
}
interface EfficacyProfile {
  vaccineKeywords: string[];
  fullProtectionDays: number;
  halfLifeDays: number;
  minProtectionPct: number;
}

type VaccinationEx = Vaccination & { patientName?: string };

@Component({
  selector: 'app-infection-vaccination',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './infection-vaccination.html',
  styleUrls: ['./infection-vaccination.css']
})
export class InfectionVaccinationComponent implements OnInit {

  constructor(
    private svc: InfectionVaccinationService,
    private cdr: ChangeDetectorRef,
    public auth: AuthRoleService
  ) {}

  ngOnInit() {
    this.loadAll();
    if (this.auth.isMedecin()) {
      this.loadKeycloakPatients();
    }
  }

  // ── State ──────────────────────────────────────────────────────────────────
  infections:   Infection[]     = [];
  vaccinations: VaccinationEx[] = [];
  loading       = false;
  apiError      = '';

  // ── Patient lists ──────────────────────────────────────────────────────────
  keycloakPatients: PatientUser[] = [];

  get patients(): PatientUser[] {
    if (this.auth.isMedecin()) {
      return this.keycloakPatients;
    } else if (this.auth.isPatient()) {
      const username = this.auth.getUsername();
      return username ? [{ username, displayName: username }] : [];
    }
    return [];
  }

  loadKeycloakPatients() {
    this.auth.getPatientUsers().subscribe({
      next: (users: PatientUser[]) => {
        this.keycloakPatients = users;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading Keycloak patients:', err);
        this.keycloakPatients = [];
      }
    });
  }

  // ── Load ───────────────────────────────────────────────────────────────────
  loadAll() {
    this.loading  = true;
    this.apiError = '';
    this.svc.getAllInfections().subscribe({
      next: data => {
        this.infections = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        this.apiError = 'Could not reach the server at localhost:8095.';
        this.loading  = false;
        this.cdr.detectChanges();
        console.error(err);
      }
    });
    this.svc.getAllVaccinations().subscribe({
      next: data => {
        this.vaccinations = data.map(v => ({ ...v, booster_taken: v.booster_taken ?? false }));
        this.cdr.detectChanges();
      },
      error: err => console.error('Vaccinations load error:', err)
    });
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  showNotifications     = true;
  showNotificationPanel = false;

  toggleNotificationPanel() { this.showNotificationPanel = !this.showNotificationPanel; }
  dismissNotifications()    { this.showNotifications = false; }

  get vaccinationNotifications(): string[] {
    const today  = this.todayIso;
    const in7Str = this.daysFromNow(7);
    const scope  = this.auth.isPatient()
      ? this.vaccinations.filter(v =>
          this.getVaccinationPatient(v).trim().toLowerCase() ===
          (this.auth.getUsername() || '').trim().toLowerCase())
      : this.vaccinations;
    return scope
      .filter(v => !v.taken && v.vaccination_date && v.vaccination_date <= in7Str)
      .map(v => {
        if (v.vaccination_date < today)   return `🔴|<strong>${v.name}</strong> vaccination was due ${new Date(v.vaccination_date).toLocaleDateString()} — <strong>OVERDUE</strong>`;
        if (v.vaccination_date === today) return `💉|<strong>${v.name}</strong> vaccination is due <strong>TODAY</strong>`;
        const d = Math.round((new Date(v.vaccination_date).getTime() - Date.now()) / 86400000);
        return `💉|<strong>${v.name}</strong> due in ${d} day(s)`;
      });
  }

  get boosterNotifications(): string[] {
    const today  = this.todayIso;
    const in7Str = this.daysFromNow(7);
    const scope  = this.auth.isPatient()
      ? this.vaccinations.filter(v =>
          this.getVaccinationPatient(v).trim().toLowerCase() ===
          (this.auth.getUsername() || '').trim().toLowerCase())
      : this.vaccinations;
    return scope
      .filter(v => !v.booster_taken && v.booster_date && v.booster_date <= in7Str)
      .map(v => {
        if (v.booster_date! < today)   return `🟠|<strong>${v.name}</strong> booster was due ${new Date(v.booster_date!).toLocaleDateString()} — <strong>OVERDUE</strong>`;
        if (v.booster_date === today)  return `💉|<strong>${v.name}</strong> booster is due <strong>TODAY</strong>`;
        const d = Math.round((new Date(v.booster_date!).getTime() - Date.now()) / 86400000);
        return `💉|<strong>${v.name}</strong> booster due in ${d} day(s)`;
      });
  }

  get totalNotificationCount() {
    return this.vaccinationNotifications.length + this.boosterNotifications.length;
  }

  // ── Delete confirmation ────────────────────────────────────────────────────
  deleteConfirm = { show: false, type: '', name: '', id: 0 };

  askDeleteInfection(id: number, name: string) {
    if (this.auth.isPatient()) return;
    this.deleteConfirm = { show: true, type: 'infection', name, id };
  }

  askDeleteVaccination(id: number, name: string) {
    if (this.auth.isPatient()) return;
    this.deleteConfirm = { show: true, type: 'vaccination', name, id };
  }

  cancelDelete() { this.deleteConfirm = { show: false, type: '', name: '', id: 0 }; }

  confirmDelete() {
    if (this.deleteConfirm.type === 'infection') {
      this.svc.deleteInfection(this.deleteConfirm.id).subscribe({
        next: () => {
          const linked = this.vaccinations.filter(v => v.infectionId === this.deleteConfirm.id);
          if (!linked.length) { this.loadAll(); return; }
          let pending = linked.length;
          linked.forEach(v =>
            this.svc.deleteVaccination(v.id).subscribe({
              next:  () => { if (!--pending) this.loadAll(); },
              error: () => { if (!--pending) this.loadAll(); }
            })
          );
        },
        error: err => console.error(err)
      });
    } else {
      this.svc.deleteVaccination(this.deleteConfirm.id).subscribe({ next: () => this.loadAll() });
    }
    this.cancelDelete();
  }

  // ── Certificate export (medecin only) ──────────────────────────────────────
  showPatientModal = false;
  patientInfo      = { name: '', dob: '', doctor: '', hospital: '' };
  patientTouched:  Record<string, boolean> = {};
  certLoading      = false;

  get patientNameError() {
    return this.patientTouched['name'] && !this.patientInfo.name ? 'Please select a patient.' : '';
  }
  openPatientModal()      { this.showPatientModal = true; }
  closePatientModal()     { this.showPatientModal = false; }
  touchPatient(f: string) { this.patientTouched[f] = true; }

  exportCertificate() {
    this.touchPatient('name');
    if (this.patientNameError) return;
    this.certLoading = true;

    const pInfections   = this.infections.filter(i => i.patientName === this.patientInfo.name);
    const pVaccinations = this.vaccinations.filter(v => this.getVaccinationPatient(v) === this.patientInfo.name);
    const generated     = new Date().toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' });
    const hmacSeed      = btoa(`${this.patientInfo.name}|${this.todayIso}|${pVaccinations.length}`).substring(0, 32).toUpperCase();

    const sevColor = (s: string) => ({ Asymptomatic: '#22c55e', Mild: '#84cc16', Moderate: '#f59e0b', Severe: '#ef4444', Critical: '#7f1d1d' }[s] ?? '#94a3b8');

    const infRows = pInfections.length
      ? pInfections.map(i => `<tr><tr>${i.type}</td><td><span style="background:${sevColor(i.severity)}20;color:${sevColor(i.severity)};padding:2px 10px;border-radius:99px;font-weight:700;font-size:12px;">${i.severity}</span></td><td>${new Date(i.detectionDate).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</td></tr>`).join('')
      : '<tr><td colspan="3" style="text-align:center;color:#94a3b8;font-style:italic;">No infections recorded</td></tr>';

    const vacRows = pVaccinations.length
      ? pVaccinations.map(v => `<tr><td>${v.name}</td><td>${new Date(v.vaccination_date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}</td><td>${v.booster_date ? new Date(v.booster_date).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}</td><td style="text-align:center;">${v.taken ? '<span style="color:#16a34a;font-weight:800;">✓ Yes</span>' : '<span style="color:#dc2626;font-weight:700;">✗ No</span>'}</td><td style="text-align:center;">${v.booster_date ? (v.booster_taken ? '<span style="color:#16a34a;font-weight:800;">✓ Yes</span>' : '<span style="color:#dc2626;font-weight:700;">✗ No</span>') : '—'}</td></tr>`).join('')
      : '<tr><td colspan="5" style="text-align:center;color:#94a3b8;font-style:italic;">No vaccinations recorded</td></tr>';

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Vaccination Certificate — ${this.patientInfo.name}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Nunito',sans-serif;background:#f0f4f8;color:#1e293b;}.page{max-width:780px;margin:32px auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.12);}.header{background:linear-gradient(135deg,#0d3b6e,#1f8dd6);padding:36px 40px;display:flex;justify-content:space-between;align-items:flex-start;}.header-left h1{font-size:24px;font-weight:900;color:white;}.header-left p{font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;}.header-right .badge{background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.3);border-radius:10px;padding:8px 14px;}.header-right .badge p{font-size:11px;color:rgba(255,255,255,0.7);font-weight:600;}.header-right .badge strong{font-size:13px;color:white;font-weight:800;display:block;margin-top:2px;}.patient-block{background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:24px 40px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;}.patient-block .field label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;}.patient-block .field p{font-size:15px;font-weight:800;color:#1e293b;margin-top:3px;}.body{padding:32px 40px;}.section-title{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:14px;display:flex;align-items:center;gap:8px;}.section-title::after{content:'';flex:1;height:1px;background:#e2e8f0;}table{width:100%;border-collapse:collapse;margin-bottom:32px;font-size:13px;}thead tr{background:linear-gradient(135deg,#f1f5f9,#e8edf5);}thead th{padding:10px 14px;text-align:left;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;color:#475569;}tbody tr{border-bottom:1px solid #f1f5f9;}tbody td{padding:11px 14px;color:#374151;font-weight:600;}.footer{background:#f8fafc;border-top:2px solid #e2e8f0;padding:20px 40px;display:flex;justify-content:space-between;align-items:center;}.hmac-block{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px 16px;}.hmac-block p{font-size:10px;color:#94a3b8;font-weight:600;margin-bottom:3px;}.hmac-block code{font-size:11px;font-family:monospace;color:#374151;font-weight:700;letter-spacing:1px;}.footer-right{text-align:right;}.footer-right p{font-size:11px;color:#94a3b8;font-weight:600;}.footer-right strong{font-size:13px;color:#1e293b;font-weight:800;display:block;margin-top:2px;}@media print{body{background:white;}.page{margin:0;border-radius:0;box-shadow:none;max-width:100%;}@page{margin:0;}}</style></head>
<body><div class="page"><div class="header"><div class="header-left"><h1>🏥 Vaccination Certificate</h1><p>Official medical record — KidneyCare Portal</p></div><div class="header-right"><div class="badge"><p>Date Issued</p><strong>${generated}</strong></div></div></div>
<div class="patient-block"><div class="field"><label>Patient Name</label><p>${this.patientInfo.name}</p></div><div class="field"><label>Date of Birth</label><p>${this.patientInfo.dob ? new Date(this.patientInfo.dob).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'}) : '—'}</p></div><div class="field"><label>Attending Doctor</label><p>${this.patientInfo.doctor||'—'}</p></div><div class="field"><label>Hospital / Clinic</label><p>${this.patientInfo.hospital||'—'}</p></div><div class="field"><label>Specialty</label><p>Nephrology</p></div><div class="field"><label>Record Type</label><p>Vaccination Certificate</p></div></div>
<div class="body"><div class="section-title">Infection History</div></table><thead><tr><th>Infection Type</th><th>Severity</th><th>Detection Date</th></tr></thead><tbody>${infRows}</tbody></table>
<div class="section-title">Vaccination Record</div><table><thead><tr><th>Vaccine</th><th>Scheduled Date</th><th>Booster Date</th><th style="text-align:center;">Taken</th><th style="text-align:center;">Booster Done</th></tr></thead><tbody>${vacRows}</tbody></table></div>
<div class="footer"><div class="hmac-block"><p>HMAC-SHA256 Authenticity Signature</p><code>${hmacSeed}</code></div><div class="footer-right"><p>Generated by KidneyCare Portal</p><strong>${generated}</strong></div></div></div>
<script>window.onload=function(){window.focus();setTimeout(function(){window.print();},400);};</script></body></html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
    this.certLoading = false;
    this.closePatientModal();
  }

  // ── Recurrence / predictions ───────────────────────────────────────────────
  showRecurrenceAlert = false;
  showRecurrencePanel = false;

  get recurrenceMap(): Record<string, Infection[]> {
    const map: Record<string, Infection[]> = {};
    for (const inf of this.infections) {
      const key = `${(inf.patientName || '').trim().toLowerCase()}::${inf.type.trim().toLowerCase()}`;
      (map[key] = map[key] ?? []).push(inf);
    }
    return map;
  }

  get recurringTypes() {
    return Object.entries(this.recurrenceMap)
      .filter(([, list]) => list.length > 1)
      .map(([, list]) => ({
        type:       list[0].type,
        patient:    list[0].patientName || '',
        count:      list.length,
        infections: [...list].sort((a, b) =>
          new Date(a.detectionDate).getTime() - new Date(b.detectionDate).getTime())
      }))
      .sort((a, b) => b.count - a.count);
  }

  get allPredictions() {
    let recurring = [...this.recurringTypes];
    if (this.auth.isPatient()) {
      const username = this.auth.getUsername();
      if (username) {
        recurring = recurring.filter(rec =>
          rec.patient.trim().toLowerCase() === username.trim().toLowerCase()
        );
      }
    }
    return recurring.map(rec => ({ ...rec, prediction: this.getPrediction(rec) }));
  }

  private avgDaysBetween(infs: Infection[]): number {
    if (infs.length < 2) return 0;
    const s = [...infs].sort((a, b) =>
      new Date(a.detectionDate).getTime() - new Date(b.detectionDate).getTime());
    let total = 0;
    for (let i = 1; i < s.length; i++)
      total += Math.round((new Date(s[i].detectionDate).getTime() - new Date(s[i-1].detectionDate).getTime()) / 86400000);
    return Math.round(total / (s.length - 1));
  }

  getAvgDaysBetween(infs: Infection[]) { return this.avgDaysBetween(infs); }

  getRecurrenceSpanDays(infs: Infection[]): number {
    if (!infs || infs.length < 2) return 0;
    const s = [...infs].sort((a, b) =>
      new Date(a.detectionDate).getTime() - new Date(b.detectionDate).getTime());
    return Math.round(
      (new Date(s[s.length-1].detectionDate).getTime() - new Date(s[0].detectionDate).getTime()) / 86400000
    );
  }

  getRecurrenceLevel(count: number): 'warning' | 'danger' | 'critical' {
    if (count >= 5) return 'critical';
    if (count >= 3) return 'danger';
    return 'warning';
  }

  getRecurrenceColour(count: number) {
    if (count >= 5) return { bg: '#fef2f2', border: '#fca5a5', dot: '#ef4444', text: '#991b1b' };
    if (count >= 3) return { bg: '#fff7ed', border: '#fed7aa', dot: '#f97316', text: '#9a3412' };
    return               { bg: '#fefce8', border: '#fef08a', dot: '#eab308', text: '#854d0e' };
  }

  getRecurrenceCount(inf: Infection): number {
    const key = `${(inf.patientName || '').trim().toLowerCase()}::${inf.type.trim().toLowerCase()}`;
    return (this.recurrenceMap[key] || []).length;
  }

  getPrediction(rec: { type: string; count: number; infections: Infection[] }) {
    const sorted  = [...rec.infections].sort((a, b) =>
      new Date(a.detectionDate).getTime() - new Date(b.detectionDate).getTime());
    const avgDays = this.avgDaysBetween(sorted);
    const reasons: string[] = [];
    let chance = Math.min(25 + (rec.count - 1) * 18, 88);
    reasons.push(`${rec.count} episodes give a base probability of ${chance}%.`);
    if (avgDays > 0 && avgDays <= 30)       { chance = Math.min(chance + 12, 95); reasons.push(`Very frequent (avg ${avgDays}d) — +12%.`); }
    else if (avgDays > 30 && avgDays <= 90) { chance = Math.min(chance + 6,  95); reasons.push(`Moderate frequency (avg ${avgDays}d) — +6%.`); }
    else if (avgDays > 180)                 { chance = Math.max(chance - 10, 10); reasons.push(`Episodes far apart (avg ${avgDays}d) — -10%.`); }
    else if (avgDays > 0)                   { reasons.push(`Average interval: ${avgDays} days.`); }
    const sevOrder = ['Asymptomatic', 'Mild', 'Moderate', 'Severe', 'Critical'];
    const lastSev  = sevOrder.indexOf(sorted[sorted.length - 1].severity);
    const firstSev = sevOrder.indexOf(sorted[0].severity);
    if (lastSev > firstSev)      { chance = Math.min(chance + 8, 95); reasons.push(`Severity escalating — +8%.`); }
    else if (lastSev < firstSev) { chance = Math.max(chance - 6, 10); reasons.push(`Severity improving — -6%.`); }
    const linked = this.vaccinations.find(v =>
      v.infectionId !== null && rec.infections.some(i => i.id === v.infectionId));
    if (linked) {
      if (linked.taken) {
        const ago = Math.round((Date.now() - new Date(linked.vaccination_date).getTime()) / 86400000);
        const cut = ago <= 180 ? 30 : 15;
        chance = Math.max(chance - cut, 5);
        reasons.push(`Vaccination taken ${ago}d ago — -${cut}%.`);
        if (linked.booster_taken) { chance = Math.max(chance - 10, 5); reasons.push(`Booster taken — -10%.`); }
      } else {
        chance = Math.min(chance + 10, 95);
        reasons.push(`Linked vaccination not yet taken — +10%.`);
      }
    } else {
      chance = Math.min(chance + 8, 95);
      reasons.push(`No linked vaccination — +8%.`);
    }
    const variance = Math.max(Math.round((avgDays || 90) * 0.22), 7);
    const mid   = new Date(sorted[sorted.length - 1].detectionDate);
    mid.setDate(mid.getDate() + (avgDays || 90));
    const early = new Date(mid); early.setDate(early.getDate() - variance);
    const late  = new Date(mid); late.setDate(late.getDate()  + variance);
    const fmt   = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    reasons.push(`Window: last episode + avg interval ± ${variance}d.`);
    let label = 'Low'; let color = '#eab308';
    if (chance >= 70)      { label = 'High';     color = '#ef4444'; }
    else if (chance >= 45) { label = 'Moderate'; color = '#f97316'; }
    return { chance, earliest: fmt(early), latest: fmt(late), label, color, reasons };
  }

  // ── Infection form (medecin only) ──────────────────────────────────────────
  showForm        = false;
  editMode        = false;
  editingInfId:   number | null = null;
  newInfection    = { type: '', severity: '', detectionDate: '', patientName: '' };
  infTouched:     Record<string, boolean> = {};
  showTypeSuggestions = false;

  readonly severityLevels = ['Asymptomatic', 'Mild', 'Moderate', 'Severe', 'Critical'];

  readonly infectionSuggestions = [
    'UTI (Urinary Tract Infection)', 'Peritonitis', 'CMV (Cytomegalovirus)',
    'BK Virus Nephropathy', 'Pneumonia', 'Septicemia', 'Wound Infection',
    'Candidiasis', 'Aspergillosis', 'Herpes Simplex', 'COVID-19', 'Influenza',
    'EBV (Epstein-Barr Virus)', 'Hepatitis B', 'Hepatitis C', 'Tuberculosis',
    'C. difficile', 'MRSA', 'Streptococcal Infection', 'E. coli Infection',
    'Klebsiella Infection', 'Pseudomonas Infection'
  ];

  get filteredTypeSuggestions() {
    if (!this.newInfection.type) return this.infectionSuggestions;
    return this.infectionSuggestions.filter(s =>
      s.toLowerCase().includes(this.newInfection.type.toLowerCase()));
  }

  get infTypeError()     { return this.infTouched['type']          && !this.newInfection.type.trim()  ? 'Infection type is required.'  : ''; }
  get infSeverityError() { return this.infTouched['severity']      && !this.newInfection.severity      ? 'Severity is required.'         : ''; }
  get infDateError()     { return this.infTouched['detectionDate'] && !this.newInfection.detectionDate ? 'Detection date is required.'   : ''; }
  get infPatientError()  { return this.infTouched['patientName']   && !this.newInfection.patientName   ? 'Patient name is required.'     : ''; }

  get infDuplicateError() {
    if (!this.editMode && this.newInfection.type && this.newInfection.detectionDate && this.newInfection.patientName) {
      const dup = this.infections.find(i =>
        i.type.trim().toLowerCase() === this.newInfection.type.trim().toLowerCase() &&
        i.detectionDate === this.newInfection.detectionDate &&
        i.patientName   === this.newInfection.patientName);
      if (dup) return 'This infection already exists for this patient on the same date.';
    }
    return '';
  }

  get infFormValid() {
    return !!this.newInfection.type.trim() && !!this.newInfection.severity &&
           !!this.newInfection.detectionDate && !!this.newInfection.patientName && !this.infDuplicateError;
  }

  touchInfField(f: string) { this.infTouched[f] = true; }
  onTypeInput()   { this.showTypeSuggestions = true; }
  onTypeBlur()    { setTimeout(() => this.showTypeSuggestions = false, 150); }
  selectSuggestion(s: string) { this.newInfection.type = s; this.showTypeSuggestions = false; }

  openAddForm() {
    if (this.auth.isPatient()) return;
    if (this.auth.isMedecin()) this.loadKeycloakPatients();
    this.editMode = false;
    this.editingInfId = null;
    this.newInfection = { type: '', severity: '', detectionDate: '', patientName: '' };
    this.infTouched = {};
    this.showForm = true;
  }

  editInfection(inf: Infection) {
    if (this.auth.isPatient()) return;
    this.editMode = true;
    this.editingInfId = inf.id;
    this.newInfection = { type: inf.type, severity: inf.severity, detectionDate: inf.detectionDate, patientName: inf.patientName };
    this.infTouched = {};
    this.showForm = true;
  }

  closeForm() { this.showForm = false; this.infTouched = {}; }

  saveInfection() {
    ['type', 'severity', 'detectionDate', 'patientName'].forEach(f => this.touchInfField(f));
    if (!this.infFormValid) return;
    if (this.editMode && this.editingInfId !== null) {
      this.svc.updateInfection(this.editingInfId, this.newInfection).subscribe({
        next: () => { this.loadAll(); this.closeForm(); }, error: err => console.error(err)
      });
    } else {
      this.svc.createInfection(this.newInfection).subscribe({
        next: () => { this.loadAll(); this.closeForm(); }, error: err => console.error(err)
      });
    }
  }

  // ── Infection filters ──────────────────────────────────────────────────────
  infectionSearch        = '';
  infectionSeverity      = '';
  infectionPatientFilter = '';
  infectionDateSearch    = '';
  infectionSortBy        = '';
  infectionSortDir: 'asc' | 'desc' = 'asc';

  /**
   * Returns the patient name to filter infections by.
   *
   * - Patient role  → always the logged-in username (locked, cannot be changed).
   *                   If the username hasn't resolved yet we return null so the
   *                   caller can decide to defer (show nothing) rather than
   *                   accidentally showing all records.
   * - Medecin role  → whatever the dropdown has selected ('' means show all).
   */
  get effectiveInfectionPatientFilter(): string | null {
    if (this.auth.isPatient()) {
      const username = this.auth.getUsername();
      console.log('[INF FILTER] role=patient | getUsername()=', JSON.stringify(username));
      // Username not yet resolved — return null so we show nothing rather than everything
      return username ? username.trim().toLowerCase() : null;
    }
    console.log('[INF FILTER] role=medecin | infectionPatientFilter=', JSON.stringify(this.infectionPatientFilter));
    // Medecin: empty string = no filter (show all), any value = filter to that patient
    return this.infectionPatientFilter || '';
  }

  get filteredInfections(): Infection[] {
    const patFilter = this.effectiveInfectionPatientFilter;
    console.log('[INF] patFilter=', JSON.stringify(patFilter), '| total infections=', this.infections.length);

    // Patient whose username hasn't resolved yet → show nothing (safe default)
    if (patFilter === null) {
      console.log('[INF] username not resolved yet → returning []');
      return [];
    }

    let r = [...this.infections];

    // Non-empty string means we must filter (covers both patient's own name and
    // medecin's dropdown selection).  Empty string means medecin wants all records.
    if (patFilter !== '') {
      r = r.filter(i => {
        const dbName = i.patientName.trim().toLowerCase();
        const match  = dbName === patFilter;
        console.log(`[INF] comparing DB="${dbName}" vs filter="${patFilter}" → ${match}`);
        return match;
      });
    }

    if (this.infectionSearch) {
      r = r.filter(i => i.type.toLowerCase().includes(this.infectionSearch.toLowerCase()));
    }
    if (this.infectionSeverity) {
      r = r.filter(i => i.severity === this.infectionSeverity);
    }
    if (this.infectionDateSearch) {
      r = r.filter(i => i.detectionDate === this.infectionDateSearch);
    }
    if (this.infectionSortBy) {
      r.sort((a, b) => {
        let va: any = (a as any)[this.infectionSortBy] ?? '';
        let vb: any = (b as any)[this.infectionSortBy] ?? '';
        if (this.infectionSortBy === 'severity') {
          va = this.severityLevels.indexOf(a.severity);
          vb = this.severityLevels.indexOf(b.severity);
        }
        return (va < vb ? -1 : va > vb ? 1 : 0) * (this.infectionSortDir === 'asc' ? 1 : -1);
      });
    }
    console.log('[INF] final result count=', r.length);
    return r;
  }

  toggleInfectionSort(field: string) {
    if (this.infectionSortBy === field) this.infectionSortDir = this.infectionSortDir === 'asc' ? 'desc' : 'asc';
    else { this.infectionSortBy = field; this.infectionSortDir = 'asc'; }
  }

  clearInfectionFilters() {
    this.infectionSearch = this.infectionSeverity = this.infectionDateSearch = this.infectionSortBy = '';
    this.infectionSortDir = 'asc';
    // Only medecins have a resettable patient filter; patients are always locked to themselves
    if (this.auth.isMedecin()) this.infectionPatientFilter = '';
  }

  getSeverityMeter(severity: string) {
    const m: Record<string, { width: string; color: string }> = {
      Asymptomatic: { width: '20%',  color: '#22c55e' },
      Mild:         { width: '40%',  color: '#84cc16' },
      Moderate:     { width: '60%',  color: '#f59e0b' },
      Severe:       { width: '80%',  color: '#ef4444' },
      Critical:     { width: '100%', color: '#7f1d1d' }
    };
    return m[severity] ?? { width: '0%', color: '#e2e8f0' };
  }

  // ── Vaccination form (medecin only) ────────────────────────────────────────
  showVaccinationSection = false;
  showVaccinationForm    = false;
  editingVacId: number | null = null;
  newVaccination = { name: '', patientName: '', vaccination_date: '', booster_date: '', infectionId: null as number | null, taken: false };
  vacTouched: Record<string, boolean> = {};
  showVacNameSuggestions = false;

  readonly vaccineSuggestions = [
    'Hepatitis B', 'Hepatitis A', 'COVID-19 mRNA', 'COVID-19 Vector', 'Influenza',
    'MMR (Measles-Mumps-Rubella)', 'Varicella', 'Tetanus-Diphtheria',
    'Pneumococcal (PCV13)', 'Pneumococcal (PPSV23)', 'Meningococcal',
    'HPV (Human Papillomavirus)', 'Tdap', 'BCG (Tuberculosis)', 'Rabies',
    'Yellow Fever', 'Typhoid', 'Cholera', 'Japanese Encephalitis', 'Zoster (Shingles)'
  ];

  get filteredVacSuggestions() {
    if (!this.newVaccination.name) return this.vaccineSuggestions;
    return this.vaccineSuggestions.filter(s =>
      s.toLowerCase().includes(this.newVaccination.name.toLowerCase()));
  }

  get minBoosterDate() {
    if (!this.newVaccination.vaccination_date) return this.todayIso;
    const d = new Date(this.newVaccination.vaccination_date);
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  }

  get vacNameError()    { return this.vacTouched['name']             && !this.newVaccination.name.trim()          ? 'Vaccine name is required.'    : ''; }
  get vacDateError()    { return this.vacTouched['vaccination_date'] && !this.newVaccination.vaccination_date      ? 'Vaccination date is required.' : ''; }
  get vacBoosterError() {
    if (!this.vacTouched['booster_date'] || !this.newVaccination.booster_date) return '';
    return (this.newVaccination.vaccination_date && this.newVaccination.booster_date < this.minBoosterDate)
      ? 'Booster must be at least 3 days after vaccination date.' : '';
  }
  get vacDuplicateNameError() {
    if (!this.editMode && this.newVaccination.name.trim()) {
      const dup = this.vaccinations.find(v =>
        v.name.trim().toLowerCase() === this.newVaccination.name.trim().toLowerCase());
      if (dup) return 'A vaccination with this name already exists.';
    }
    return '';
  }
  get vacFormValid() {
    return !!this.newVaccination.name.trim() && !!this.newVaccination.vaccination_date &&
           !this.vacBoosterError && !this.vacDuplicateNameError;
  }

  touchField(f: string)  { this.vacTouched[f] = true; }
  onVacNameBlur()        { setTimeout(() => this.showVacNameSuggestions = false, 150); }
  selectVacSuggestion(s: string) { this.newVaccination.name = s; this.showVacNameSuggestions = false; }
  toggleVaccinationSection() { this.showVaccinationSection = !this.showVaccinationSection; }

  openAddVaccinationForm() {
    if (this.auth.isPatient()) return;
    if (this.auth.isMedecin()) this.loadKeycloakPatients();
    this.editMode = false;
    this.editingVacId = null;
    this.newVaccination = { name: '', patientName: '', vaccination_date: '', booster_date: '', infectionId: null, taken: false };
    this.vacTouched = {};
    this.showVaccinationForm = true;
  }

  editVaccination(vac: VaccinationEx) {
    if (this.auth.isPatient()) return;
    this.editMode = true;
    this.editingVacId = vac.id;
    this.newVaccination = {
      name: vac.name,
      patientName: vac.patientName ?? this.getVaccinationPatient(vac),
      vaccination_date: vac.vaccination_date,
      booster_date: vac.booster_date || '',
      infectionId: vac.infectionId,
      taken: vac.taken
    };
    this.vacTouched = {};
    this.showVaccinationForm = true;
  }

  closeVaccinationForm() { this.showVaccinationForm = false; this.vacTouched = {}; }

  saveVaccination() {
    ['name', 'vaccination_date'].forEach(f => this.touchField(f));
    if (!this.vacFormValid) return;
    const linkedInfection = this.infections.find(i => i.id === this.newVaccination.infectionId);
    const patientName = this.newVaccination.patientName || linkedInfection?.patientName || '';
    const payload = { ...this.newVaccination, patientName, booster_taken: false };
    if (this.editMode && this.editingVacId !== null) {
      const prev = this.vaccinations.find(v => v.id === this.editingVacId);
      const booster_taken = prev?.booster_taken ?? false;
      this.svc.deleteVaccination(this.editingVacId).subscribe({
        next: () => this.svc.createVaccination({ ...payload, booster_taken }).subscribe({
          next: () => { this.loadAll(); this.closeVaccinationForm(); }, error: err => console.error(err)
        }), error: err => console.error(err)
      });
    } else {
      this.svc.createVaccination(payload).subscribe({
        next: () => { this.loadAll(); this.closeVaccinationForm(); }, error: err => console.error(err)
      });
    }
  }

  markAsTaken(id: number) {
    if (this.auth.isPatient()) return;
    const vac = this.vaccinations.find(v => v.id === id);
    if (!vac) return;
    const { id: _id, ...body } = vac;
    this.svc.deleteVaccination(id).subscribe({
      next: () => this.svc.createVaccination({ ...body, taken: true }).subscribe({ next: () => this.loadAll() })
    });
  }

  markBoosterAsTaken(id: number) {
    if (this.auth.isPatient()) return;
    const vac = this.vaccinations.find(v => v.id === id);
    if (!vac) return;
    const { id: _id, ...body } = vac;
    this.svc.deleteVaccination(id).subscribe({
      next: () => this.svc.createVaccination({ ...body, booster_taken: true }).subscribe({ next: () => this.loadAll() })
    });
  }

  // ── Vaccination filters ────────────────────────────────────────────────────
  vaccinationSearch        = '';
  vaccinationInfId: any    = '';
  vaccinationDateSearch    = '';
  vaccinationTakenFilter   = 'all';
  vaccinationPatientFilter = '';
  vaccinationSortBy        = '';
  vaccinationSortDir: 'asc' | 'desc' = 'asc';

  getVaccinationPatient(vac: VaccinationEx): string {
    if (vac.patientName) return vac.patientName;
    if (vac.infectionId != null)
      return this.infections.find(i => i.id === vac.infectionId)?.patientName ?? '';
    return '';
  }

  /**
   * Same logic as effectiveInfectionPatientFilter but for the vaccinations list.
   *
   * - Patient role  → locked to their own username; null if not yet resolved.
   * - Medecin role  → dropdown value ('' = all patients).
   */
  get effectiveVaccinationPatientFilter(): string | null {
    if (this.auth.isPatient()) {
      const username = this.auth.getUsername();
      console.log('[VAC FILTER] role=patient | getUsername()=', JSON.stringify(username));
      return username ? username.trim().toLowerCase() : null;
    }
    console.log('[VAC FILTER] role=medecin | vaccinationPatientFilter=', JSON.stringify(this.vaccinationPatientFilter));
    return this.vaccinationPatientFilter || '';
  }

  get filteredVaccinations(): VaccinationEx[] {
    const patFilter = this.effectiveVaccinationPatientFilter;
    console.log('[VAC] patFilter=', JSON.stringify(patFilter), '| total vaccinations=', this.vaccinations.length);

    // Patient whose username hasn't resolved yet → show nothing (safe default)
    if (patFilter === null) {
      console.log('[VAC] username not resolved yet → returning []');
      return [];
    }

    let r = [...this.vaccinations];

    // Non-empty: filter to the specific patient name
    if (patFilter !== '') {
      r = r.filter(v => {
        const dbName = this.getVaccinationPatient(v).trim().toLowerCase();
        const match  = dbName === patFilter;
        console.log(`[VAC] comparing DB="${dbName}" vs filter="${patFilter}" → ${match}`);
        return match;
      });
    }

    if (this.vaccinationSearch) {
      r = r.filter(v => v.name.toLowerCase().includes(this.vaccinationSearch.toLowerCase()));
    }
    if (this.vaccinationInfId === null) {
      r = r.filter(v => v.infectionId === null);
    } else if (this.vaccinationInfId !== '') {
      r = r.filter(v => v.infectionId === Number(this.vaccinationInfId));
    }
    if (this.vaccinationDateSearch) {
      r = r.filter(v => v.vaccination_date === this.vaccinationDateSearch || v.booster_date === this.vaccinationDateSearch);
    }
    if (this.vaccinationTakenFilter === 'taken')     r = r.filter(v => v.taken);
    if (this.vaccinationTakenFilter === 'not-taken') r = r.filter(v => !v.taken);
    if (this.vaccinationSortBy) {
      r.sort((a, b) => {
        const va = (a as any)[this.vaccinationSortBy] ?? '';
        const vb = (b as any)[this.vaccinationSortBy] ?? '';
        return (va < vb ? -1 : va > vb ? 1 : 0) * (this.vaccinationSortDir === 'asc' ? 1 : -1);
      });
    }
    console.log('[VAC] final result count=', r.length);
    return r;
  }

  toggleVaccinationSort(field: string) {
    if (this.vaccinationSortBy === field) this.vaccinationSortDir = this.vaccinationSortDir === 'asc' ? 'desc' : 'asc';
    else { this.vaccinationSortBy = field; this.vaccinationSortDir = 'asc'; }
  }

  clearVaccinationFilters() {
    this.vaccinationSearch = this.vaccinationDateSearch = this.vaccinationSortBy = '';
    this.vaccinationInfId  = '';
    this.vaccinationTakenFilter = 'all';
    this.vaccinationSortDir = 'asc';
    // Only medecins have a resettable patient filter; patients are always locked to themselves
    if (this.auth.isMedecin()) this.vaccinationPatientFilter = '';
  }

  get vaccinationProgress() {
    const vacs = [...this.filteredVaccinations];
    const taken = vacs.filter(v => v.taken).length;
    const total = vacs.length;
    const label = this.auth.isPatient()
      ? (this.auth.getUsername() || 'My Progress')
      : (this.vaccinationPatientFilter || 'All Patients');
    return { taken, total, score: total === 0 ? 0 : Math.round(taken / total * 100), label };
  }

  // ── Medical Intelligence ───────────────────────────────────────────────────
  readonly interactionRules: InteractionRule[] = [
    { vaccineA: ['mmr','measles','mumps','rubella'], vaccineB: ['varicella','chickenpox','zoster'], minDaysBetween: 28, severity: 'critical', reason: 'Live virus vaccines (MMR & Varicella) must be separated by at least 28 days to avoid immune interference.' },
    { vaccineA: ['mmr','measles','mumps','rubella'], vaccineB: ['influenza','flu'], minDaysBetween: 28, severity: 'warning', reason: 'MMR and live attenuated influenza vaccine should be separated by 28 days when not given simultaneously.' },
    { vaccineA: ['cholera'], vaccineB: ['typhoid'], minDaysBetween: 8, severity: 'warning', reason: 'Oral cholera and typhoid vaccines should be separated by at least 8 days due to potential immune interference.' },
    { vaccineA: ['covid','covid-19','coronavirus'], vaccineB: ['influenza','flu'], minDaysBetween: 14, severity: 'warning', reason: 'COVID-19 and influenza vaccines should be separated by 14 days to allow accurate side-effect monitoring.' },
    { vaccineA: ['bcg','yellow fever'], vaccineB: ['mmr','measles','varicella','chickenpox'], minDaysBetween: 28, severity: 'critical', reason: 'Two live attenuated vaccines given too close together risk combined immune overload — separate by 28 days.' },
    { vaccineA: ['pneumococcal','pneumonia'], vaccineB: ['meningococcal','meningitis'], minDaysBetween: 7, severity: 'warning', reason: 'Pneumococcal and meningococcal vaccines given within 7 days may amplify local reactions.' }
  ];

  readonly contraindicationRules: ContraindicationRule[] = [
    { vaccineKeywords: ['mmr','measles','varicella','chickenpox','bcg','yellow fever','rotavirus'], contraindications: { severities: ['Severe','Critical'] }, severity: 'critical', message: 'Live vaccines are contraindicated in patients with Severe or Critical active infections due to impaired immune response.' },
    { vaccineKeywords: ['mmr','measles','varicella','bcg'], contraindications: { infectionKeywords: ['nephritis','glomerulo','renal','pyelonephritis','nephrotic','kidney'] }, severity: 'warning', message: 'Live vaccines should be used with caution in patients with active renal infections — consult a nephrologist before administering.' },
    { vaccineKeywords: ['hepatitis b','hep b'], contraindications: { infectionKeywords: ['hepatitis','liver'] }, severity: 'warning', message: 'Hepatitis B vaccine in a patient with active hepatitis — monitor liver enzymes and confirm with a specialist before proceeding.' },
    { vaccineKeywords: ['influenza','flu'], contraindications: { severities: ['Critical'] }, severity: 'critical', message: 'Influenza vaccine is contraindicated during a critical active infection — defer until the patient stabilises.' },
    { vaccineKeywords: ['typhoid'], contraindications: { infectionKeywords: ['typhoid','salmonella'] }, severity: 'warning', message: 'Typhoid vaccine should not be given during an active Salmonella/Typhoid infection — defer until fully recovered.' },
    { vaccineKeywords: ['cholera'], contraindications: { infectionKeywords: ['cholera','gastroenteritis'] }, severity: 'warning', message: 'Cholera vaccine should be deferred during active gastrointestinal infection to avoid masking symptoms.' }
  ];

  readonly efficacyProfiles: EfficacyProfile[] = [
    { vaccineKeywords: ['hepatitis b','hep b'],        fullProtectionDays: 365*5,  halfLifeDays: 365*3,  minProtectionPct: 20 },
    { vaccineKeywords: ['hepatitis a','hep a'],        fullProtectionDays: 365*10, halfLifeDays: 365*5,  minProtectionPct: 30 },
    { vaccineKeywords: ['influenza','flu'],            fullProtectionDays: 150,    halfLifeDays: 80,     minProtectionPct: 5  },
    { vaccineKeywords: ['covid','covid-19'],           fullProtectionDays: 150,    halfLifeDays: 90,     minProtectionPct: 10 },
    { vaccineKeywords: ['mmr','measles','mumps'],      fullProtectionDays: 365*20, halfLifeDays: 365*10, minProtectionPct: 50 },
    { vaccineKeywords: ['varicella','chickenpox'],     fullProtectionDays: 365*10, halfLifeDays: 365*5,  minProtectionPct: 40 },
    { vaccineKeywords: ['tetanus','tdap','dtap'],      fullProtectionDays: 365*7,  halfLifeDays: 365*3,  minProtectionPct: 15 },
    { vaccineKeywords: ['pneumococcal','pneumonia'],   fullProtectionDays: 365*3,  halfLifeDays: 365*2,  minProtectionPct: 10 },
    { vaccineKeywords: ['meningococcal','meningitis'], fullProtectionDays: 365*3,  halfLifeDays: 365*2,  minProtectionPct: 10 },
    { vaccineKeywords: ['hpv','papillomavirus'],       fullProtectionDays: 365*10, halfLifeDays: 365*5,  minProtectionPct: 40 },
    { vaccineKeywords: ['typhoid'],                    fullProtectionDays: 365*2,  halfLifeDays: 365,    minProtectionPct: 10 },
    { vaccineKeywords: ['yellow fever'],               fullProtectionDays: 365*10, halfLifeDays: 365*5,  minProtectionPct: 30 },
    { vaccineKeywords: ['rabies'],                     fullProtectionDays: 365,    halfLifeDays: 180,    minProtectionPct: 10 },
    { vaccineKeywords: ['cholera'],                    fullProtectionDays: 180,    halfLifeDays: 90,     minProtectionPct: 5  },
    { vaccineKeywords: ['bcg','tuberculosis'],         fullProtectionDays: 365*15, halfLifeDays: 365*5,  minProtectionPct: 20 },
    { vaccineKeywords: ['rotavirus'],                  fullProtectionDays: 365*3,  halfLifeDays: 365,    minProtectionPct: 5  },
  ];

  private matchesKeywords(name: string, keywords: string[]): boolean {
    const n = name.toLowerCase();
    return keywords.some(k => n.includes(k.toLowerCase()));
  }

  get vacInteractionWarnings(): { severity: 'warning' | 'critical'; message: string }[] {
    const newName = this.newVaccination.name.trim();
    const newDate = this.newVaccination.vaccination_date;
    if (!newName || !newDate) return [];
    const warnings: { severity: 'warning' | 'critical'; message: string }[] = [];
    const takenVacs = this.vaccinations.filter(v => v.taken && v.id !== (this.editingVacId ?? -1));
    for (const rule of this.interactionRules) {
      const newMatchesA = this.matchesKeywords(newName, rule.vaccineA);
      const newMatchesB = this.matchesKeywords(newName, rule.vaccineB);
      if (!newMatchesA && !newMatchesB) continue;
      for (const existing of takenVacs) {
        const exMatchesA = this.matchesKeywords(existing.name, rule.vaccineA);
        const exMatchesB = this.matchesKeywords(existing.name, rule.vaccineB);
        if (!((newMatchesA && exMatchesB) || (newMatchesB && exMatchesA))) continue;
        const daysBetween = Math.abs(Math.round(
          (new Date(newDate).getTime() - new Date(existing.vaccination_date).getTime()) / 86400000
        ));
        if (daysBetween < rule.minDaysBetween)
          warnings.push({ severity: rule.severity, message: `Conflict with "${existing.name}" taken ${daysBetween}d ago (min ${rule.minDaysBetween}d required): ${rule.reason}` });
      }
    }
    return warnings;
  }

  get vacContraindicationWarnings(): { severity: 'warning' | 'critical'; message: string }[] {
    const newName = this.newVaccination.name.trim();
    if (!newName) return [];
    const warnings: { severity: 'warning' | 'critical'; message: string }[] = [];
    const linked   = this.newVaccination.infectionId
      ? this.infections.find(i => i.id === this.newVaccination.infectionId) ?? null : null;
    const relevant = linked ? [linked] : this.infections;
    for (const rule of this.contraindicationRules) {
      if (!this.matchesKeywords(newName, rule.vaccineKeywords)) continue;
      for (const inf of relevant) {
        const severityMatch = rule.contraindications.severities?.includes(inf.severity);
        const keywordMatch  = rule.contraindications.infectionKeywords &&
                              this.matchesKeywords(inf.type, rule.contraindications.infectionKeywords);
        if (severityMatch || keywordMatch) { warnings.push({ severity: rule.severity, message: rule.message }); break; }
      }
    }
    return warnings.filter((w, i, arr) => arr.findIndex(x => x.message === w.message) === i);
  }

  get vacFormMedicalWarnings(): { severity: string; message: string }[] {
    return [...this.vacInteractionWarnings, ...this.vacContraindicationWarnings];
  }

  getCardMedicalWarnings(vac: VaccinationEx): { severity: string; message: string }[] {
    const ws: { severity: string; message: string }[] = [];
    if (!vac.taken && vac.vaccination_date < this.todayIso) {
      const d = Math.round((Date.now() - new Date(vac.vaccination_date).getTime()) / 86400000);
      ws.push({ severity: 'critical', message: `Vaccination is ${d} day(s) overdue.` });
    }
    const tempName  = this.newVaccination.name;
    const tempInfId = this.newVaccination.infectionId;
    this.newVaccination.name        = vac.name;
    this.newVaccination.infectionId = vac.infectionId;
    const contra = this.vacContraindicationWarnings;
    this.newVaccination.name        = tempName;
    this.newVaccination.infectionId = tempInfId;
    ws.push(...contra);
    const pct = this.getEfficacyPercent(vac);
    if (pct !== null && pct < 30)
      ws.push({ severity: 'critical', message: `Protection critically low (${pct}%). Booster strongly recommended.` });
    else if (pct !== null && pct < 50)
      ws.push({ severity: 'warning',  message: `Protection declining (${pct}%). Consider a booster.` });
    return ws.filter((w, i, arr) => arr.findIndex(x => x.message === w.message) === i);
  }

  getEfficacyPercent(vac: VaccinationEx): number | null {
    if (!vac.taken || !vac.vaccination_date) return null;
    const profile = this.efficacyProfiles.find(p => this.matchesKeywords(vac.name, p.vaccineKeywords));
    if (!profile) return null;
    const ref = vac.booster_taken && vac.booster_date ? vac.booster_date : vac.vaccination_date;
    const daysSince = Math.round((Date.now() - new Date(ref).getTime()) / 86400000);
    if (daysSince <= 0) return 100;
    if (daysSince <= profile.fullProtectionDays) return 100;
    const daysBeyond = daysSince - profile.fullProtectionDays;
    const pct = Math.round(100 * Math.pow(0.5, daysBeyond / profile.halfLifeDays));
    return Math.max(pct, profile.minProtectionPct);
  }

  getEfficacyColor(pct: number): string {
    if (pct >= 75) return '#10b981';
    if (pct >= 50) return '#84cc16';
    if (pct >= 25) return '#f59e0b';
    return '#ef4444';
  }

  getVacStatus(vac: VaccinationEx): 'overdue' | 'today' | 'upcoming' | 'ok' {
    if (vac.taken || !vac.vaccination_date) return 'ok';
    const t = this.todayIso;
    if (vac.vaccination_date < t)   return 'overdue';
    if (vac.vaccination_date === t) return 'today';
    return 'upcoming';
  }

  getBoosterStatus(vac: VaccinationEx): 'overdue' | 'today' | 'upcoming' | 'ok' | 'none' {
    if (!vac.booster_date) return 'none';
    if (vac.booster_taken) return 'ok';
    const t = this.todayIso;
    if (vac.booster_date < t)   return 'overdue';
    if (vac.booster_date === t) return 'today';
    return 'upcoming';
  }

  getCardStyle(vac: VaccinationEx): Record<string, string> {
    if (vac.taken && (!vac.booster_date || vac.booster_taken))
      return { 'border-color': '#86efac', 'background': '#f0fdf4' };
    if (this.getVacStatus(vac) === 'overdue' || this.getBoosterStatus(vac) === 'overdue')
      return { 'border-color': '#fca5a5' };
    return {};
  }

  getInfectionName(id: number | null): string {
    if (id === null) return 'Standalone';
    return this.infections.find(i => i.id === id)?.type ?? 'Unknown';
  }

  getProgressGradient(score: number) {
    if (score <= 25) return 'linear-gradient(90deg,#ef4444,#f97316)';
    if (score <= 50) return 'linear-gradient(90deg,#f97316,#f59e0b)';
    if (score <= 75) return 'linear-gradient(90deg,#f59e0b,#84cc16)';
    return                  'linear-gradient(90deg,#22c55e,#10b981)';
  }

  get todayIso() { return new Date().toISOString().split('T')[0]; }

  private daysFromNow(n: number) {
    const d = new Date(); d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  }

  showProfileMenu = false;

  logout() { this.auth.logout(); }
}