import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthRoleService, PatientUser } from '../services/auth-role.service';
import { InfectionVaccinationService } from '../services/infection-vaccination'
import {
  GraftFunctionService,
  GraftFunctionEntry,
  ReferenceValue,
  AlertThreshold,
  GraftSurvivalScore
} from '../services/graft-function';

export type ActiveTab = 'entries' | 'reference' | 'thresholds' | 'scores';

@Component({
  selector: 'app-graft-function',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './graft-function.html',
  styleUrls: ['./graft-function.css']
})
export class GraftFunctionComponent implements OnInit {
  Math = Math;

  constructor(
    public svc: GraftFunctionService,
    public cdr: ChangeDetectorRef,
    public auth: AuthRoleService,
    private infectionVacSvc: InfectionVaccinationService
  ) {}

  ngOnInit() {
    this.loadAll();
    if (this.auth.isMedecin()) {
      this.loadKeycloakPatients();
    }
  }

  // ── Patient list ───────────────────────────────────────────────────────────
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

  // ── Comparison modal ────────────────────────────────────────────────────────
showCompareModal  = false;
comparePatientId  = '';
compareSearched   = false;

projectedStats: {
  avgEGFR: number | null;
  avgCreatinine: number | null;
  survival1Year: number | null;
  survival3Year: number | null;
  survival5Year: number | null;
  riskLevel: string | null;
  basedOnCount: number;
} | null = null;

// ── Vaccination Impact Panel ───────────────────────────────────────────────
showVacImpact        = false;
vacImpactLoading     = false;
vacImpactError       = '';
patientVaccinations: any[] = [];
vacImpactScore: {
  adjusted1Year: number;
  adjusted3Year: number;
  adjusted5Year: number;
  delta1Year: number;
  delta3Year: number;
  delta5Year: number;
  reasons: { vaccine: string; impact: number; reason: string; taken: boolean }[];
} | null = null;

compareResults: {
  patientId: string;
  similarityScore: number;
  avgEGFR: number;
  avgCreatinine: number;
  entryCount: number;
  latestScore: GraftSurvivalScore | null;
}[] = [];

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

  // ── Static data ────────────────────────────────────────────────────────────
  readonly collectionTypes = ['ROUTINE', 'URGENT', 'POST_BIOPSY'];
  readonly alertLevels     = ['WATCH', 'WARNING', 'CRITICAL'];
  readonly riskLevels      = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

  // ── State ──────────────────────────────────────────────────────────────────
  entries:    GraftFunctionEntry[] = [];
  refs:       ReferenceValue[]     = [];
  thresholds: AlertThreshold[]     = [];
  scores:     GraftSurvivalScore[] = [];
  loading     = false;
  apiError    = '';

  activeTab: ActiveTab = 'entries';

  setTab(tab: ActiveTab) {
    this.activeTab = tab;
  }


 // ── Load all ───────────────────────────────────────────────────────────────
loadAll() {
  this.loading  = true;
  this.apiError = '';

  if (this.auth.isMedecin()) {
    // Medecin: load all data (original behaviour)
    this.svc.getAllEntries().subscribe({
      next: d => { this.entries = d; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.apiError = 'Cannot reach server at localhost:8095.'; this.loading = false; this.cdr.detectChanges(); }
    });
    this.svc.getAllRefs().subscribe({
      next: d => { this.refs = d; this.cdr.detectChanges(); },
      error: err => console.error(err)
    });
    this.svc.getAllThresholds().subscribe({
      next: d => { this.thresholds = d; this.cdr.detectChanges(); },
      error: err => console.error(err)
    });
    this.svc.getAllScores().subscribe({
      next: d => { this.scores = d; this.cdr.detectChanges(); },
      error: err => console.error(err)
    });
  } else if (this.auth.isPatient()) {
    // Patient: load only own data
    const patientId = this.auth.getUsername();
    if (!patientId) {
      this.loading = false;
      return;
    }

    // Entries
    this.svc.getEntriesByPatient(patientId).subscribe({
      next: d => { this.entries = d; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.apiError = 'Cannot reach server at localhost:8095.'; this.loading = false; this.cdr.detectChanges(); }
    });

    // Reference values (single object or 404)
    this.svc.getRefByPatient(patientId).subscribe({
      next: d => { this.refs = d ? [d] : []; this.cdr.detectChanges(); },
      error: err => {
        if (err.status !== 404) console.error(err);
        this.refs = [];
        this.cdr.detectChanges();
      }
    });

    // Alert thresholds (single object or 404)
    this.svc.getThresholdByPatient(patientId).subscribe({
      next: d => { this.thresholds = d ? [d] : []; this.cdr.detectChanges(); },
      error: err => {
        if (err.status !== 404) console.error(err);
        this.thresholds = [];
        this.cdr.detectChanges();
      }
    });

    // Survival scores (array)
    this.svc.getScoresByPatient(patientId).subscribe({
      next: d => { this.scores = d; this.cdr.detectChanges(); },
      error: err => {
        if (err.status !== 404) console.error(err);
        this.scores = [];
        this.cdr.detectChanges();
      }
    });
  } else {
    this.loading = false;
  }
}

  // ── Delete confirmation ────────────────────────────────────────────────────
  deleteConfirm = { show: false, type: '', label: '', id: 0 };

  askDelete(type: string, id: number, label: string) {
    this.deleteConfirm = { show: true, type, label, id };
  }
  cancelDelete() { this.deleteConfirm = { show: false, type: '', label: '', id: 0 }; }

  confirmDelete() {
    const { type, id } = this.deleteConfirm;
    const call =
      type === 'entry'     ? this.svc.deleteEntry(id)     :
      type === 'ref'       ? this.svc.deleteRef(id)       :
      type === 'threshold' ? this.svc.deleteThreshold(id) :
                             this.svc.deleteScore(id);
    call.subscribe({ next: () => this.loadAll(), error: err => console.error(err) });
    this.cancelDelete();
  }

  // ── Effective patient filter ───────────────────────────────────────────────
  public get effectivePatientFilter(): string | null {
    if (this.auth.isPatient()) {
      const username = this.auth.getUsername();
      return username ? username.trim().toLowerCase() : null;
    }
    return this.entryPatientFilter || '';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // AUTO-GENERATE SCORE MODAL
  // ══════════════════════════════════════════════════════════════════════════

  /** Controls modal visibility */
  showAutoScoreModal  = false;
  /** The patient selected inside the modal (medecin picks; patient uses own id) */
  autoScorePatientId  = '';
  /** Tracks whether the user has tried to submit without a patient */
  autoScoreTouched    = false;

  /** Open the modal and pre-load patients for medecin */
  openAutoScoreModal() {
    if (this.auth.isMedecin()) {
      this.loadKeycloakPatients();
      this.autoScorePatientId = '';
    } else {
      // Patients auto-use their own username — no selection needed
      this.autoScorePatientId = this.auth.getUsername() || '';
    }
    this.autoScoreTouched   = false;
    this.showAutoScoreModal = true;
    // Switch to scores tab so the pre-filled form is visible after generation
    this.setTab('scores');
  }

  /** Close without generating */
  closeAutoScoreModal() {
    this.showAutoScoreModal = false;
    this.autoScoreTouched   = false;
  }

openCompareModal() {
  if (this.auth.isPatient()) {
    this.comparePatientId = this.auth.getUsername() || '';
  } else {
    this.comparePatientId = '';
  }
  this.compareResults  = [];
  this.compareSearched = false;
  this.projectedStats  = null;
  this.showCompareModal = true;
}

closeCompareModal() { this.showCompareModal = false; }

toggleVaccImpact() {
  if (this.showVacImpact) {
    this.showVacImpact = false;
    return;
  }
  this.showVacImpact = true;
  this.vacImpactLoading = true;
  this.vacImpactError = '';
  this.vacImpactScore = null;
  this.patientVaccinations = [];

  const username = (this.auth.getUsername() || '').trim().toLowerCase();

  this.svc.getVaccinations().subscribe({
    next: (all) => {
      this.patientVaccinations = all.filter(
        v => (v.patientName || '').trim().toLowerCase() === username
      );
      this.computeVacImpact();
      this.vacImpactLoading = false;
      this.cdr.detectChanges();
    },
    error: () => {
      this.vacImpactError = 'Could not load vaccination data from the server.';
      this.vacImpactLoading = false;
      this.cdr.detectChanges();
    }
  });
}


toggleVacImpact() {
  if (this.showVacImpact) {
    this.showVacImpact = false;
    return;
  }
  this.showVacImpact = true;
  this.vacImpactLoading = true;
  this.vacImpactError = '';
  this.vacImpactScore = null;
  this.patientVaccinations = [];

  const username = (this.auth.getUsername() || '').trim().toLowerCase();

  this.infectionVacSvc.getAllVaccinations().subscribe({
    next: (all) => {
      this.patientVaccinations = all.filter(
        v => (v.patientName || '').trim().toLowerCase() === username
      );
      this.computeVacImpact();
      this.vacImpactLoading = false;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error(err);
      this.vacImpactError = 'Could not load vaccination data from the server.';
      this.vacImpactLoading = false;
      this.cdr.detectChanges();
    }
  });
}
private computeVacImpact() {
  const patientId = (this.auth.getUsername() || '').trim().toLowerCase();
  const latest = [...this.scores]
    .filter(s => s.patientId.trim().toLowerCase() === patientId)
    .sort((a, b) => new Date(b.calculatedAt || '').getTime() - new Date(a.calculatedAt || '').getTime())[0];

  const base1 = latest ? (latest.survivalProbability1Year ?? 0.75) : 0.75;
  const base3 = latest ? (latest.survivalProbability3Year ?? 0.60) : 0.60;
  const base5 = latest ? (latest.survivalProbability5Year ?? 0.50) : 0.50;

  // Vaccine weight map — higher = more critical for transplant/renal patients
  const weightMap: Record<string, number> = {
    'influenza': 0.025, 'flu': 0.025,
    'pneumococcal': 0.030, 'pcv': 0.030, 'ppsv': 0.030,
    'hepatitis b': 0.025, 'hep b': 0.025,
    'hepatitis a': 0.015, 'hep a': 0.015,
    'covid': 0.020, 'covid-19': 0.020,
    'mmr': 0.015, 'measles': 0.015,
    'varicella': 0.015, 'chickenpox': 0.015,
    'tdap': 0.010, 'tetanus': 0.010,
    'meningococcal': 0.010, 'meningitis': 0.010,
  };

  const getWeight = (name: string): number => {
    const n = name.toLowerCase();
    for (const [key, w] of Object.entries(weightMap)) {
      if (n.includes(key)) return w;
    }
    return 0.010; // default small weight
  };

  const reasons: { vaccine: string; impact: number; reason: string; taken: boolean }[] = [];
  let delta1 = 0, delta3 = 0, delta5 = 0;

  for (const v of this.patientVaccinations) {
    const w = getWeight(v.name);
    const today = Date.now();
    const vacDate = typeof v.vaccination_date === 'number' ? v.vaccination_date : new Date(v.vaccination_date).getTime();
    const isOverdue = !v.taken && vacDate < today;

    if (v.taken && v.booster_taken) {
      const d1 = w * 1.0, d3 = w * 1.5, d5 = w * 2.0;
      delta1 += d1; delta3 += d3; delta5 += d5;
      reasons.push({ vaccine: v.name, impact: d1, taken: true,
        reason: `Vaccine taken + booster done → full immunity benefit (+${(d1*100).toFixed(1)}% / +${(d3*100).toFixed(1)}% / +${(d5*100).toFixed(1)}% over 1/3/5yr)` });
    } else if (v.taken && !v.booster_taken && v.booster_date) {
      const boosterDate = typeof v.booster_date === 'number' ? v.booster_date : new Date(v.booster_date).getTime();
      const boosterOverdue = boosterDate < today;
      const d1 = w * 0.5, d3 = w * 0.5, d5 = w * 0.5;
      delta1 += d1; delta3 += d3; delta5 += d5;
      reasons.push({ vaccine: v.name, impact: d1, taken: true,
        reason: `Vaccine taken but booster ${boosterOverdue ? 'overdue' : 'pending'} → partial benefit (+${(d1*100).toFixed(1)}% per horizon)` });
    } else if (v.taken) {
      const d1 = w * 0.8, d3 = w * 1.2, d5 = w * 1.5;
      delta1 += d1; delta3 += d3; delta5 += d5;
      reasons.push({ vaccine: v.name, impact: d1, taken: true,
        reason: `Vaccine taken (no booster needed) → immunity benefit (+${(d1*100).toFixed(1)}% / +${(d3*100).toFixed(1)}% / +${(d5*100).toFixed(1)}% over 1/3/5yr)` });
    } else if (isOverdue) {
      const d1 = -w * 1.2, d3 = -w * 1.5, d5 = -w * 2.0;
      delta1 += d1; delta3 += d3; delta5 += d5;
      reasons.push({ vaccine: v.name, impact: d1, taken: false,
        reason: `Overdue vaccination → increased infection risk (${(d1*100).toFixed(1)}% / ${(d3*100).toFixed(1)}% / ${(d5*100).toFixed(1)}% over 1/3/5yr)` });
    } else {
      const d1 = -w * 0.5, d3 = -w * 0.8, d5 = -w * 1.0;
      delta1 += d1; delta3 += d3; delta5 += d5;
      reasons.push({ vaccine: v.name, impact: d1, taken: false,
        reason: `Vaccination not yet taken → unprotected risk factor (${(d1*100).toFixed(1)}% / ${(d3*100).toFixed(1)}% / ${(d5*100).toFixed(1)}% over 1/3/5yr)` });
    }
  }

  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  this.vacImpactScore = {
    adjusted1Year: clamp(base1 + delta1),
    adjusted3Year: clamp(base3 + delta3),
    adjusted5Year: clamp(base5 + delta5),
    delta1Year: delta1,
    delta3Year: delta3,
    delta5Year: delta5,
    reasons
  };
}

onComparePatientChange() {
  this.compareResults  = [];
  this.compareSearched = false;
  this.projectedStats  = null;
}

runComparison() {
  const refPid = (this.auth.isPatient()
    ? this.auth.getUsername()
    : this.comparePatientId
  )?.trim().toLowerCase();

  if (!refPid) return;

  // Get reference patient's most recent entry
  const refEntries = this.entries
    .filter(e => e.patientId.trim().toLowerCase() === refPid)
    .sort((a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime());

  if (refEntries.length === 0) { this.compareSearched = true; this.compareResults = []; return; }

  const refEntry = refEntries[0];
  const refAvgEGFR = refEntries.filter(e => e.eGFR !== null).reduce((s, e) => s + (e.eGFR ?? 0), 0)
                     / (refEntries.filter(e => e.eGFR !== null).length || 1);
  const refAvgCr   = refEntries.filter(e => e.creatinine !== null).reduce((s, e) => s + (e.creatinine ?? 0), 0)
                     / (refEntries.filter(e => e.creatinine !== null).length || 1);
  const refWeight  = refEntries.find(e => e.weight !== null)?.weight ?? null;

  // Group all OTHER patients
  const otherPids = [...new Set(
    this.entries
      .filter(e => e.patientId.trim().toLowerCase() !== refPid)
      .map(e => e.patientId.trim().toLowerCase())
  )];

 const scored = otherPids.map(pid => {
    const pEntries = this.entries
      .filter(e => e.patientId.trim().toLowerCase() === pid)
      .sort((a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime());

    const avgEGFR  = pEntries.filter(e => e.eGFR !== null).reduce((s, e) => s + (e.eGFR ?? 0), 0)
                     / (pEntries.filter(e => e.eGFR !== null).length || 1);
    const avgCr    = pEntries.filter(e => e.creatinine !== null).reduce((s, e) => s + (e.creatinine ?? 0), 0)
                     / (pEntries.filter(e => e.creatinine !== null).length || 1);
    const pWeight  = pEntries.find(e => e.weight !== null)?.weight ?? null;
    const pType    = pEntries[0]?.collectionType ?? '';
    const latestScore = this.scores
      .filter(s => s.patientId.trim().toLowerCase() === pid)
      .sort((a, b) => new Date(b.calculatedAt || '').getTime() - new Date(a.calculatedAt || '').getTime())[0] ?? null;

    // Weighted similarity: lower deductions = more similar
    let score = 100;
    if (avgEGFR && refAvgEGFR) score -= Math.min(40, Math.abs(avgEGFR - refAvgEGFR) * 0.8);
    if (avgCr && refAvgCr)     score -= Math.min(30, Math.abs(avgCr - refAvgCr) * 15);
    if (pWeight && refWeight)  score -= Math.min(20, Math.abs(pWeight - refWeight) * 0.5);
    if (pType !== refEntry.collectionType) score -= 10;

    return {
      patientId: pEntries[0].patientId,
      similarityScore: Math.max(0, Math.round(score)),
      avgEGFR, avgCreatinine: avgCr,
      entryCount: pEntries.length,
      latestScore
    };
  });

scored.sort((a, b) => b.similarityScore - a.similarityScore);

this.compareResults  = scored.slice(0, 1);   // always show only the single best match
this.compareSearched = true;

// ── Compute projected stats from matched patients ──────────────────────────
const matched = this.compareResults;
if (matched.length > 0) {
  const totalWeight = matched.reduce((s, r) => s + r.similarityScore, 0) || 1;

  const wAvg = (getter: (r: typeof matched[0]) => number | null) => {
    const relevant = matched.filter(r => getter(r) !== null);
    if (relevant.length === 0) return null;
    const wSum = relevant.reduce((s, r) => s + r.similarityScore, 0) || 1;
    return relevant.reduce((s, r) => s + (getter(r) ?? 0) * r.similarityScore, 0) / wSum;
  };

  const wAvgSurvival = (year: '1' | '3' | '5') => {
    const withScore = matched.filter(r => r.latestScore !== null);
    if (withScore.length === 0) return null;
    const wSum = withScore.reduce((s, r) => s + r.similarityScore, 0) || 1;
    return withScore.reduce((s, r) => {
      const val = year === '1' ? r.latestScore!.survivalProbability1Year
                : year === '3' ? r.latestScore!.survivalProbability3Year
                :                r.latestScore!.survivalProbability5Year;
      return s + (val ?? 0) * r.similarityScore;
    }, 0) / wSum;
  };
  

  const proj1 = wAvgSurvival('1');
  const proj3 = wAvgSurvival('3');
  const proj5 = wAvgSurvival('5');

  let projRisk: string | null = null;
  if (proj1 !== null) {
    projRisk = proj1 >= 0.8 ? 'LOW' : proj1 >= 0.6 ? 'MODERATE' : proj1 >= 0.4 ? 'HIGH' : 'CRITICAL';
  }

  this.projectedStats = {
    avgEGFR:       wAvg(r => r.avgEGFR),
    avgCreatinine: wAvg(r => r.avgCreatinine),
    survival1Year: proj1 !== null ? Math.round(proj1 * 100) / 100 : null,
    survival3Year: proj3 !== null ? Math.round(proj3 * 100) / 100 : null,
    survival5Year: proj5 !== null ? Math.round(proj5 * 100) / 100 : null,
    riskLevel:     projRisk,
    basedOnCount:  matched.length
  };
} else {
  this.projectedStats = null;
}

this.cdr.detectChanges();
}

  /**
   * Called when the user clicks "Generate Score" inside the modal.
   * Validates patient selection, calls computeScoreFromEntries(), then closes the modal.
   */
  triggerAutoScore() {
    this.autoScoreTouched = true;
    const pid = this.auth.isPatient()
      ? (this.auth.getUsername() || '')
      : this.autoScorePatientId;

    if (!pid) return;                 // guard: patient must be selected
    this.closeAutoScoreModal();
    this.computeScoreFromEntries(pid);
  }

  /**
   * Returns the total number of graft entries for a given patient id
   * (used in the modal's data-available info box).
   */
  getPatientEntryCount(patientId: string): number {
    if (!patientId) return 0;
    const pid = patientId.trim().toLowerCase();
    return this.entries.filter(e => e.patientId.trim().toLowerCase() === pid).length;
  }

  /**
   * Returns the number of entries that have a non-null eGFR value
   * (minimum 2 required for the slope computation to work).
   */
  getPatientEGFRCount(patientId: string): number {
    if (!patientId) return 0;
    const pid = patientId.trim().toLowerCase();
    return this.entries.filter(
      e => e.patientId.trim().toLowerCase() === pid && e.eGFR !== null
    ).length;
  }

  // ── GRAFT FUNCTION ENTRY — CRUD ────────────────────────────────────────────
  showEntryForm  = false;
  editEntryMode  = false;
  editEntryId:   number | null = null;
  entryTouched:  Record<string, boolean> = {};
  newEntry: Partial<GraftFunctionEntry> = this.emptyEntry();

  public normalizePatientId(pid: any): string {
    return (pid ?? '').toString().trim().toLowerCase();
  }

  public optionalNumberError(
    raw: any,
    label: string,
    min: number,
    max: number
  ): string {
    if (raw === null || raw === undefined || raw === '') return '';
    const n = Number(raw);
    if (!Number.isFinite(n)) return `${label} must be a valid number.`;
    if (n < min || n > max) return `${label} must be between ${min} and ${max}.`;
    return '';
  }

  public entryErrors(): Record<string, string> {
    const errs: Record<string, string> = {};

    const patientId = this.normalizePatientId(this.newEntry.patientId);
    if (!patientId) errs['patientId'] = 'Patient is required.';

    const measurementDateRaw = (this.newEntry.measurementDate ?? '').toString().trim();
    if (!measurementDateRaw) errs['measurementDate'] = 'Measurement date is required.';
    else {
      const ts = Date.parse(measurementDateRaw);
      if (!Number.isFinite(ts)) errs['measurementDate'] = 'Measurement date is invalid.';
    }

    const cErr = this.optionalNumberError(this.newEntry.creatinine, 'Creatinine (mg/dL)', 0.1, 20);
    if (cErr) errs['creatinine'] = cErr;
    const gErr = this.optionalNumberError(this.newEntry.eGFR, 'eGFR (mL/min/1.73m²)', 0, 2000);
    if (gErr) errs['eGFR'] = gErr;
    const uErr = this.optionalNumberError(this.newEntry.urineOutput, 'Urine Output (mL/24h)', 0, 100000);
    if (uErr) errs['urineOutput'] = uErr;
    const tErr = this.optionalNumberError(this.newEntry.tacrolimusLevel, 'Tacrolimus Level (ng/mL)', 0, 50);
    if (tErr) errs['tacrolimusLevel'] = tErr;
    const wErr = this.optionalNumberError(this.newEntry.weight, 'Weight (kg)', 0.1, 300);
    if (wErr) errs['weight'] = wErr;
    const tempErr = this.optionalNumberError(this.newEntry.temperature, 'Temperature (°C)', 30, 45);
    if (tempErr) errs['temperature'] = tempErr;

    const sysErr = this.optionalNumberError(this.newEntry.systolicBP, 'Systolic BP (mmHg)', 60, 260);
    if (sysErr) errs['systolicBP'] = sysErr;
    const diaErr = this.optionalNumberError(this.newEntry.diastolicBP, 'Diastolic BP (mmHg)', 30, 170);
    if (diaErr) errs['diastolicBP'] = diaErr;

    const sysRaw: any = this.newEntry.systolicBP as any;
    const diaRaw: any = this.newEntry.diastolicBP as any;
    const sys = sysRaw === null || sysRaw === undefined || sysRaw === '' ? null : Number(sysRaw);
    const dia = diaRaw === null || diaRaw === undefined || diaRaw === '' ? null : Number(diaRaw);
    if (sys !== null && dia !== null && Number.isFinite(sys) && Number.isFinite(dia) && dia > sys) {
      errs['diastolicBP'] = 'Diastolic BP must be less than or equal to systolic BP.';
    }

    // Pulse pressure check (systolic - diastolic should be 20–100)
if (sys !== null && dia !== null && Number.isFinite(sys) && Number.isFinite(dia)) {
  const pp = sys - dia;
  if (pp < 20) errs['diastolicBP'] = 'Pulse pressure too narrow (systolic − diastolic < 20 mmHg).';
  if (pp > 100) errs['diastolicBP'] = 'Pulse pressure too wide (systolic − diastolic > 100 mmHg).';
}

    return errs;
  }

  emptyEntry(): Partial<GraftFunctionEntry> {
    return {
      patientId: '', measurementDate: '', creatinine: null, eGFR: null,
      urineOutput: null, tacrolimusLevel: null, systolicBP: null, diastolicBP: null,
      weight: null, temperature: null, collectionType: 'ROUTINE', notes: ''
    };
  }

  openAddEntry() {
    if (this.auth.isMedecin()) this.loadKeycloakPatients();
    this.editEntryMode = false;
    this.editEntryId = null;
    this.newEntry = this.emptyEntry();
    if (this.auth.isPatient()) {
      const username = this.auth.getUsername();
      if (username) this.newEntry.patientId = username;
    }
    this.entryTouched = {};
    this.showEntryForm = true;
  }

  closeEntryForm() { this.showEntryForm = false; this.entryTouched = {}; }
  touchEntry(f: string) { this.entryTouched[f] = true; }

  editEntry(e: GraftFunctionEntry) {
    this.editEntryMode = true; this.editEntryId = e.id;
    this.newEntry = { ...e }; this.entryTouched = {}; this.showEntryForm = true;
  }

  get entryPatientError() { return this.entryTouched['patientId'] ? (this.entryErrors()['patientId'] ?? '') : ''; }
  get entryDateError() { return this.entryTouched['measurementDate'] ? (this.entryErrors()['measurementDate'] ?? '') : ''; }
  get entryCreatinineError() { return this.entryTouched['creatinine'] ? (this.entryErrors()['creatinine'] ?? '') : ''; }
  get entryEGFRError() { return this.entryTouched['eGFR'] ? (this.entryErrors()['eGFR'] ?? '') : ''; }
  get entryUrineOutputError() { return this.entryTouched['urineOutput'] ? (this.entryErrors()['urineOutput'] ?? '') : ''; }
  get entryTacrolimusLevelError() { return this.entryTouched['tacrolimusLevel'] ? (this.entryErrors()['tacrolimusLevel'] ?? '') : ''; }
  get entrySystolicBPError() { return this.entryTouched['systolicBP'] ? (this.entryErrors()['systolicBP'] ?? '') : ''; }
  get entryDiastolicBPError() { return this.entryTouched['diastolicBP'] ? (this.entryErrors()['diastolicBP'] ?? '') : ''; }
  get entryWeightError() { return this.entryTouched['weight'] ? (this.entryErrors()['weight'] ?? '') : ''; }
  get entryTemperatureError() { return this.entryTouched['temperature'] ? (this.entryErrors()['temperature'] ?? '') : ''; }

  get entryFormValid() { return Object.keys(this.entryErrors()).length === 0; }

  saveEntry() {
    [
      'patientId', 'measurementDate',
      'creatinine', 'eGFR', 'urineOutput', 'tacrolimusLevel',
      'systolicBP', 'diastolicBP', 'weight', 'temperature'
    ].forEach(f => this.touchEntry(f));
    if (Object.keys(this.entryErrors()).length > 0) return;
    const call = this.editEntryMode && this.editEntryId !== null
      ? this.svc.updateEntry(this.editEntryId, this.newEntry)
      : this.svc.createEntry(this.newEntry);
    call.subscribe({ next: () => { this.loadAll(); this.closeEntryForm(); }, error: err => console.error(err) });
  }

  // ── Entry filters ──────────────────────────────────────────────────────────
  entrySearch        = '';
  entryPatientFilter = '';
  entryDateFilter    = '';
  entryTypeFilter    = '';
  entrySortBy: 'measurementDate' | 'creatinine' | 'eGFR' = 'measurementDate';
  entrySortDir: 'asc' | 'desc' = 'desc';

  get filteredEntries(): GraftFunctionEntry[] {
    const patFilter = this.effectivePatientFilter;
    if (patFilter === null) return [];

    let r = [...this.entries];
    if (patFilter !== '') {
      r = r.filter(e => e.patientId.trim().toLowerCase() === patFilter);
    }
    if (this.entryDateFilter)  r = r.filter(e => e.measurementDate === this.entryDateFilter);
    if (this.entryTypeFilter)  r = r.filter(e => e.collectionType === this.entryTypeFilter);
    if (this.entrySearch)      r = r.filter(e => e.patientId.toLowerCase().includes(this.entrySearch.toLowerCase()) || (e.notes || '').toLowerCase().includes(this.entrySearch.toLowerCase()));
    r.sort((a, b) => {
      const va: any = a[this.entrySortBy] ?? 0;
      const vb: any = b[this.entrySortBy] ?? 0;
      return (va < vb ? -1 : va > vb ? 1 : 0) * (this.entrySortDir === 'asc' ? 1 : -1);
    });
    return r;
  }

  toggleEntrySort(f: 'measurementDate' | 'creatinine' | 'eGFR') {
    if (this.entrySortBy === f) this.entrySortDir = this.entrySortDir === 'asc' ? 'desc' : 'asc';
    else { this.entrySortBy = f; this.entrySortDir = 'asc'; }
  }
  clearEntryFilters() {
    this.entrySearch = this.entryPatientFilter = this.entryDateFilter = this.entryTypeFilter = '';
    this.entrySortBy = 'measurementDate'; this.entrySortDir = 'desc';
  }

  // ── Alert evaluation ───────────────────────────────────────────────────────
  getEntryAlertLevel(entry: GraftFunctionEntry): { level: string; color: string; bg: string } | null {
    const ref = this.refs.find(r => r.patientId === entry.patientId);
    const thr = this.thresholds.find(t => t.patientId === entry.patientId);
    if (!ref || !thr) return null;
    if (entry.creatinine !== null && ref.baselineCreatinine) {
      const rise = ((entry.creatinine - ref.baselineCreatinine) / ref.baselineCreatinine) * 100;
      if (rise >= (thr.creatinineRisePercent ?? 25))
        return { level: thr.acuteDeclineLevel, color: this.alertColor(thr.acuteDeclineLevel), bg: this.alertBg(thr.acuteDeclineLevel) };
    }
    if (entry.eGFR !== null && ref.baselineEGFR) {
      const drop = ((ref.baselineEGFR - entry.eGFR) / ref.baselineEGFR) * 100;
      if (drop >= (thr.eGFRDropPercent ?? 20))
        return { level: thr.acuteDeclineLevel, color: this.alertColor(thr.acuteDeclineLevel), bg: this.alertBg(thr.acuteDeclineLevel) };
    }
    if (entry.tacrolimusLevel !== null) {
      if ((thr.tacrolimusMin && entry.tacrolimusLevel < thr.tacrolimusMin) ||
          (thr.tacrolimusMax && entry.tacrolimusLevel > thr.tacrolimusMax))
        return { level: 'WARNING', color: '#f59e0b', bg: '#fffbeb' };
    }
    return null;
  }

  alertColor(level: string): string {
    return level === 'CRITICAL' ? '#ef4444' : level === 'WARNING' ? '#f59e0b' : '#3b82f6';
  }
  alertBg(level: string): string {
    return level === 'CRITICAL' ? '#fef2f2' : level === 'WARNING' ? '#fffbeb' : '#eff6ff';
  }

  getCreatinineChange(entry: GraftFunctionEntry): number | null {
    const ref = this.refs.find(r => r.patientId === entry.patientId);
    if (!ref?.baselineCreatinine || entry.creatinine === null) return null;
    return Math.round(((entry.creatinine - ref.baselineCreatinine) / ref.baselineCreatinine) * 100);
  }

  getEGFRChange(entry: GraftFunctionEntry): number | null {
    const ref = this.refs.find(r => r.patientId === entry.patientId);
    if (!ref?.baselineEGFR || entry.eGFR === null) return null;
    return Math.round(((entry.eGFR - ref.baselineEGFR) / ref.baselineEGFR) * 100);
  }

  // ── REFERENCE VALUE ────────────────────────────────────────────────────────
  showRefForm  = false;
  editRefMode  = false;
  editRefId:   number | null = null;
  refTouched:  Record<string, boolean> = {};
  newRef: Partial<ReferenceValue> = this.emptyRef();

  emptyRef(): Partial<ReferenceValue> {
    return {
      patientId: '', establishedDate: '', baselineCreatinine: null,
      baselineEGFR: null, targetTacrolimusMin: null, targetTacrolimusMax: null,
      targetSystolicBP: null, targetDiastolicBP: null, setBy: '', notes: ''
    };
  }

  public currentUserKey(): string {
    const u = this.auth.getUsername?.();
    return (u ?? '').toString().trim().toLowerCase();
  }

  public refErrors(): Record<string, string> {
    const errs: Record<string, string> = {};

    const pid = this.normalizePatientId(this.newRef.patientId);
    if (!pid) errs['patientId'] = 'Patient is required.';

    const establishedDateRaw = (this.newRef.establishedDate ?? '').toString().trim();
    if (!establishedDateRaw) errs['establishedDate'] = 'Established date is required.';
    else {
      const ts = Date.parse(establishedDateRaw);
      if (!Number.isFinite(ts)) errs['establishedDate'] = 'Established date is invalid.';
    }

    if (pid) {
      const duplicate = this.refs.some(r => this.normalizePatientId(r.patientId) === pid && r.id !== this.editRefId);
      if (duplicate) errs['patientId'] = 'A reference value already exists for this patient.';
    }

    const bcErr = this.optionalNumberError(this.newRef.baselineCreatinine, 'Baseline Creatinine (mg/dL)', 0.1, 20);
    if (bcErr) errs['baselineCreatinine'] = bcErr;
    const beErr = this.optionalNumberError(this.newRef.baselineEGFR, 'Baseline eGFR (mL/min)', 0, 2000);

const bc = Number(this.newRef.baselineCreatinine);
const be = Number(this.newRef.baselineEGFR);
if (Number.isFinite(bc) && Number.isFinite(be)) {
  // Rough CKD-EPI cross-check: eGFR > 90 with creatinine > 3 is contradictory
  if (be > 90 && bc > 2.5)
    errs['baselineEGFR'] = 'eGFR > 90 is inconsistent with creatinine > 2.5 mg/dL.';
  if (be < 20 && bc < 1.0)
    errs['baselineCreatinine'] = 'Creatinine < 1.0 is inconsistent with eGFR < 20 mL/min.';
}
    
    if (beErr) errs['baselineEGFR'] = beErr;
    const tMinErr = this.optionalNumberError(this.newRef.targetTacrolimusMin, 'Tacrolimus Target Min (ng/mL)', 0, 50);
    if (tMinErr) errs['targetTacrolimusMin'] = tMinErr;
    const tMaxErr = this.optionalNumberError(this.newRef.targetTacrolimusMax, 'Tacrolimus Target Max (ng/mL)', 0, 50);
    if (tMaxErr) errs['targetTacrolimusMax'] = tMaxErr;
    const sysErr = this.optionalNumberError(this.newRef.targetSystolicBP, 'Target Systolic BP (mmHg)', 60, 260);
    if (sysErr) errs['targetSystolicBP'] = sysErr;
    const diaErr = this.optionalNumberError(this.newRef.targetDiastolicBP, 'Target Diastolic BP (mmHg)', 30, 170);
    if (diaErr) errs['targetDiastolicBP'] = diaErr;

    const tacMinRaw: any = this.newRef.targetTacrolimusMin as any;
    const tacMaxRaw: any = this.newRef.targetTacrolimusMax as any;
    const tacMin = tacMinRaw === null || tacMinRaw === undefined || tacMinRaw === '' ? null : Number(tacMinRaw);
    const tacMax = tacMaxRaw === null || tacMaxRaw === undefined || tacMaxRaw === '' ? null : Number(tacMaxRaw);
    if (tacMin !== null && tacMax !== null && Number.isFinite(tacMin) && Number.isFinite(tacMax) && tacMin > tacMax) {
      errs['targetTacrolimusMax'] = 'Tacrolimus Target Max must be greater than or equal to Target Min.';
    }

    const sysRaw2: any = this.newRef.targetSystolicBP as any;
    const diaRaw2: any = this.newRef.targetDiastolicBP as any;
    const sys = sysRaw2 === null || sysRaw2 === undefined || sysRaw2 === '' ? null : Number(sysRaw2);
    const dia = diaRaw2 === null || diaRaw2 === undefined || diaRaw2 === '' ? null : Number(diaRaw2);
    if (sys !== null && dia !== null && Number.isFinite(sys) && Number.isFinite(dia) && dia > sys) {
      errs['targetDiastolicBP'] = 'Target Diastolic BP must be less than or equal to Target Systolic BP.';
    }

    return errs;
  }

  openAddRef() {
    if (this.auth.isMedecin()) this.loadKeycloakPatients();
    this.editRefMode = false;
    this.editRefId = null;
    this.newRef = this.emptyRef();
    if (this.auth.isPatient()) {
      const username = this.auth.getUsername();
      if (username) this.newRef.patientId = username;
    }
    this.refTouched = {};
    this.showRefForm = true;
  }

  closeRefForm() { this.showRefForm = false; this.refTouched = {}; }
  touchRef(f: string) { this.refTouched[f] = true; }

  editRef(r: ReferenceValue) {
    this.editRefMode = true; this.editRefId = r.id;
    this.newRef = { ...r }; this.refTouched = {}; this.showRefForm = true;
  }

  get refPatientError() { return this.refTouched['patientId'] ? (this.refErrors()['patientId'] ?? '') : ''; }
  get refDateError() { return this.refTouched['establishedDate'] ? (this.refErrors()['establishedDate'] ?? '') : ''; }
  get refBaselineCreatinineError() { return this.refTouched['baselineCreatinine'] ? (this.refErrors()['baselineCreatinine'] ?? '') : ''; }
  get refBaselineEGFRError() { return this.refTouched['baselineEGFR'] ? (this.refErrors()['baselineEGFR'] ?? '') : ''; }
  get refTacMinError() { return this.refTouched['targetTacrolimusMin'] ? (this.refErrors()['targetTacrolimusMin'] ?? '') : ''; }
  get refTacMaxError() { return this.refTouched['targetTacrolimusMax'] ? (this.refErrors()['targetTacrolimusMax'] ?? '') : ''; }
  get refTargetSysBPError() { return this.refTouched['targetSystolicBP'] ? (this.refErrors()['targetSystolicBP'] ?? '') : ''; }
  get refTargetDiaBPError() { return this.refTouched['targetDiastolicBP'] ? (this.refErrors()['targetDiastolicBP'] ?? '') : ''; }

  get refFormValid() { return Object.keys(this.refErrors()).length === 0; }

  saveRef() {
    [
      'patientId', 'establishedDate',
      'baselineCreatinine', 'baselineEGFR',
      'targetTacrolimusMin', 'targetTacrolimusMax',
      'targetSystolicBP', 'targetDiastolicBP'
    ].forEach(f => this.touchRef(f));
    if (Object.keys(this.refErrors()).length > 0) return;
    const call = this.editRefMode && this.editRefId !== null
      ? this.svc.updateRef(this.editRefId, this.newRef)
      : this.svc.createRef(this.newRef);
    call.subscribe({ next: () => { this.loadAll(); this.closeRefForm(); }, error: err => console.error(err) });
  }

  refPatientFilter = '';
  get filteredRefs(): ReferenceValue[] {
    const patFilter = this.effectivePatientFilter;
    if (patFilter === null) return [];
    let r = [...this.refs];
    if (patFilter !== '') r = r.filter(x => x.patientId.trim().toLowerCase() === patFilter);
    return r;
  }

  // ── ALERT THRESHOLD ────────────────────────────────────────────────────────
  showThrForm  = false;
  editThrMode  = false;
  editThrId:   number | null = null;
  thrTouched:  Record<string, boolean> = {};
  newThreshold: Partial<AlertThreshold> = this.emptyThreshold();

  emptyThreshold(): Partial<AlertThreshold> {
    return {
      patientId: '', creatinineRisePercent: 25, eGFRDropPercent: 20,
      creatinineAbsoluteMax: 3.0, eGFRCriticalMin: 20,
      tacrolimusMin: 5, tacrolimusMax: 15,
      acuteDeclineLevel: 'WARNING', chronicDeclineLevel: 'WATCH',
      configuredBy: ''
    };
  }

  public thresholdErrors(): Record<string, string> {
    const errs: Record<string, string> = {};

    const pid = this.normalizePatientId(this.newThreshold.patientId);
    if (!pid) errs['patientId'] = 'Patient is required.';

    const userKey = this.currentUserKey();

    if (pid && userKey) {
      const duplicate = this.thresholds.some(t =>
  this.normalizePatientId(t.patientId) === pid &&
  t.id !== this.editThrId
);
if (duplicate) errs['patientId'] = 'A threshold already exists for this patient. Edit the existing one.';
    }

    const cRiseErr = this.optionalNumberError(this.newThreshold.creatinineRisePercent, 'Creatinine Rise Alert (%)', 0, 200);
    if (cRiseErr) errs['creatinineRisePercent'] = cRiseErr;
    const gDropErr = this.optionalNumberError(this.newThreshold.eGFRDropPercent, 'eGFR Drop Alert (%)', 0, 200);
    if (gDropErr) errs['eGFRDropPercent'] = gDropErr;
    const cMaxErr = this.optionalNumberError(this.newThreshold.creatinineAbsoluteMax, 'Creatinine Absolute Max (mg/dL)', 0.1, 20);
    if (cMaxErr) errs['creatinineAbsoluteMax'] = cMaxErr;
    const gMinErr = this.optionalNumberError(this.newThreshold.eGFRCriticalMin, 'eGFR Critical Min (mL/min)', 0, 2000);
    if (gMinErr) errs['eGFRCriticalMin'] = gMinErr;
    const tacMinErr = this.optionalNumberError(this.newThreshold.tacrolimusMin, 'Tacrolimus Min (ng/mL)', 0, 50);
    if (tacMinErr) errs['tacrolimusMin'] = tacMinErr;
    const tacMaxErr = this.optionalNumberError(this.newThreshold.tacrolimusMax, 'Tacrolimus Max (ng/mL)', 0, 50);
    if (tacMaxErr) errs['tacrolimusMax'] = tacMaxErr;

    const tacMinRaw: any = this.newThreshold.tacrolimusMin as any;
    const tacMaxRaw: any = this.newThreshold.tacrolimusMax as any;
    const tacMin = tacMinRaw === null || tacMinRaw === undefined || tacMinRaw === '' ? null : Number(tacMinRaw);
    const tacMax = tacMaxRaw === null || tacMaxRaw === undefined || tacMaxRaw === '' ? null : Number(tacMaxRaw);
    if (tacMin !== null && tacMax !== null && Number.isFinite(tacMin) && Number.isFinite(tacMax) && tacMin > tacMax) {
      errs['tacrolimusMax'] = 'Tacrolimus Max must be greater than or equal to Tacrolimus Min.';
    }

    if (this.newThreshold.configuredBy === null || this.newThreshold.configuredBy === undefined || this.newThreshold.configuredBy === '') {
      errs['configuredBy'] = 'Configured By is required.';
    }

    return errs;
  }

  openAddThreshold() {
    if (this.auth.isMedecin()) this.loadKeycloakPatients();
    this.editThrMode = false;
    this.editThrId = null;
    this.newThreshold = this.emptyThreshold();
    if (this.auth.isPatient()) {
      const username = this.auth.getUsername();
      if (username) this.newThreshold.patientId = username;
    }
    const userKey = this.currentUserKey();
    if (userKey) this.newThreshold.configuredBy = userKey;
    this.thrTouched = {};
    this.showThrForm = true;
  }

  closeThrForm() { this.showThrForm = false; this.thrTouched = {}; }
  touchThr(f: string) { this.thrTouched[f] = true; }

  editThreshold(t: AlertThreshold) {
    this.editThrMode = true; this.editThrId = t.id;
    this.newThreshold = { ...t }; this.thrTouched = {}; this.showThrForm = true;
  }

  get thrPatientError() { return this.thrTouched['patientId'] ? (this.thresholdErrors()['patientId'] ?? '') : ''; }
  get thrConfiguredByError() { return this.thrTouched['configuredBy'] ? (this.thresholdErrors()['configuredBy'] ?? '') : ''; }
  get thrCreatinineRisePercentError() { return this.thrTouched['creatinineRisePercent'] ? (this.thresholdErrors()['creatinineRisePercent'] ?? '') : ''; }
  get thrEGFRDropPercentError() { return this.thrTouched['eGFRDropPercent'] ? (this.thresholdErrors()['eGFRDropPercent'] ?? '') : ''; }
  get thrCreatinineAbsoluteMaxError() { return this.thrTouched['creatinineAbsoluteMax'] ? (this.thresholdErrors()['creatinineAbsoluteMax'] ?? '') : ''; }
  get thrEGFRCriticalMinError() { return this.thrTouched['eGFRCriticalMin'] ? (this.thresholdErrors()['eGFRCriticalMin'] ?? '') : ''; }
  get thrTacMinError() { return this.thrTouched['tacrolimusMin'] ? (this.thresholdErrors()['tacrolimusMin'] ?? '') : ''; }
  get thrTacMaxError() { return this.thrTouched['tacrolimusMax'] ? (this.thresholdErrors()['tacrolimusMax'] ?? '') : ''; }

  get thrFormValid() { return Object.keys(this.thresholdErrors()).length === 0; }

  saveThreshold() {
    [
      'patientId', 'configuredBy',
      'creatinineRisePercent', 'eGFRDropPercent',
      'creatinineAbsoluteMax', 'eGFRCriticalMin',
      'tacrolimusMin', 'tacrolimusMax'
    ].forEach(f => this.touchThr(f));
    if (Object.keys(this.thresholdErrors()).length > 0) return;
    const call = this.editThrMode && this.editThrId !== null
      ? this.svc.updateThreshold(this.editThrId, this.newThreshold)
      : this.svc.createThreshold(this.newThreshold);
    call.subscribe({ next: () => { this.loadAll(); this.closeThrForm(); }, error: err => console.error(err) });
  }

  thrPatientFilter = '';
  get filteredThresholds(): AlertThreshold[] {
    const patFilter = this.effectivePatientFilter;
    if (patFilter === null) return [];
    let r = [...this.thresholds];
    if (patFilter !== '') r = r.filter(x => x.patientId.trim().toLowerCase() === patFilter);
    return r;
  }

  // ── GRAFT SURVIVAL SCORE ───────────────────────────────────────────────────
  showScoreForm  = false;
  editScoreMode  = false;
  editScoreId:   number | null = null;
  scoreTouched:  Record<string, boolean> = {};
  newScore: Partial<GraftSurvivalScore> = this.emptyScore();

emptyScore(): Partial<GraftSurvivalScore> {
  return {
    patientId: '', survivalProbability1Year: null, survivalProbability3Year: null,
    survivalProbability5Year: null, riskLevel: 'LOW',
    eGFRSlope: null, creatinineSlope: null, rejectionEpisodeCount: 0,
    hasChronicDecline: false, hasAcuteDecline: false,
    tacrolimusVariability: null, calculationModel: 'MANUAL', notes: '',
    calculatedAt: new Date().toISOString()
  };
}

  public scoreErrors(): Record<string, string> {
    const errs: Record<string, string> = {};
    const pid = this.normalizePatientId(this.newScore.patientId);
    if (!pid) errs['patientId'] = 'Patient is required.';

    const validateProb = (raw: any, label: string): string => {
      if (raw === null || raw === undefined || raw === '') return `${label} is required.`;
      const n = Number(raw);
      if (!Number.isFinite(n)) return `${label} must be a valid number.`;
      if (n < 0 || n > 1) return `${label} must be between 0 and 1.`;
      return '';
    };

    const p1Err = validateProb(this.newScore.survivalProbability1Year, '1-Year Survival (0–1)');
    if (p1Err) errs['survivalProbability1Year'] = p1Err;
    const p3Err = validateProb(this.newScore.survivalProbability3Year, '3-Year Survival (0–1)');
    if (p3Err) errs['survivalProbability3Year'] = p3Err;
    const p5Err = validateProb(this.newScore.survivalProbability5Year, '5-Year Survival (0–1)');
    if (p5Err) errs['survivalProbability5Year'] = p5Err;

    const p1 = Number(this.newScore.survivalProbability1Year);
const p3 = Number(this.newScore.survivalProbability3Year);
const p5 = Number(this.newScore.survivalProbability5Year);
if (Number.isFinite(p1) && Number.isFinite(p3) && p3 > p1)
  errs['survivalProbability3Year'] = '3-year survival cannot exceed 1-year survival.';
if (Number.isFinite(p3) && Number.isFinite(p5) && p5 > p3)
  errs['survivalProbability5Year'] = '5-year survival cannot exceed 3-year survival.';
if (Number.isFinite(p1) && Number.isFinite(p5) && p5 > p1)
  errs['survivalProbability5Year'] = '5-year survival cannot exceed 1-year survival.';

    const rcRaw = this.newScore.rejectionEpisodeCount;
    const rc = Number(rcRaw);
    if (!Number.isFinite(rcRaw as any)) {
      errs['rejectionEpisodeCount'] = 'Rejection Episodes is required.';
    } else if (!Number.isFinite(rc)) {
      errs['rejectionEpisodeCount'] = 'Rejection Episodes must be a valid number.';
    } else if (rc < 0) {
      errs['rejectionEpisodeCount'] = 'Rejection Episodes must be >= 0.';
    } else if (!Number.isInteger(rc)) {
      errs['rejectionEpisodeCount'] = 'Rejection Episodes must be an integer.';
    }

    const egfrSlopeErr = this.optionalNumberError(this.newScore.eGFRSlope, 'eGFR Slope', -10, 5);
    if (egfrSlopeErr) errs['eGFRSlope'] = egfrSlopeErr;
    const creatSlopeErr = this.optionalNumberError(this.newScore.creatinineSlope, 'Creatinine Slope', -50, 50);
    if (creatSlopeErr) errs['creatinineSlope'] = creatSlopeErr;
    const tacVarErr = this.optionalNumberError(this.newScore.tacrolimusVariability, 'Tacrolimus Variability (CV)', 0, 100);
    if (tacVarErr) errs['tacrolimusVariability'] = tacVarErr;

    return errs;
  }

  openAddScore() {
    if (this.auth.isMedecin()) this.loadKeycloakPatients();
    this.editScoreMode = false;
    this.editScoreId = null;
    this.newScore = this.emptyScore();
    if (this.auth.isPatient()) {
      const username = this.auth.getUsername();
      if (username) this.newScore.patientId = username;
    }
    this.scoreTouched = {};
    this.showScoreForm = true;
  }

  closeScoreForm() { this.showScoreForm = false; this.scoreTouched = {}; }
  touchScore(f: string) { this.scoreTouched[f] = true; }

  editScore(s: GraftSurvivalScore) {
    this.editScoreMode = true; this.editScoreId = s.id;
    this.newScore = { ...s }; this.scoreTouched = {}; this.showScoreForm = true;
  }

  get scorePatientError() { return this.scoreTouched['patientId'] ? (this.scoreErrors()['patientId'] ?? '') : ''; }
  get scoreP1Error() { return this.scoreTouched['survivalProbability1Year'] ? (this.scoreErrors()['survivalProbability1Year'] ?? '') : ''; }
  get scoreP3Error() { return this.scoreTouched['survivalProbability3Year'] ? (this.scoreErrors()['survivalProbability3Year'] ?? '') : ''; }
  get scoreP5Error() { return this.scoreTouched['survivalProbability5Year'] ? (this.scoreErrors()['survivalProbability5Year'] ?? '') : ''; }
  get scoreRejectionEpisodesError() { return this.scoreTouched['rejectionEpisodeCount'] ? (this.scoreErrors()['rejectionEpisodeCount'] ?? '') : ''; }
  get scoreEGFROrror() { return this.scoreTouched['eGFRSlope'] ? (this.scoreErrors()['eGFRSlope'] ?? '') : ''; }
  get scoreCreatinineSlopeError() { return this.scoreTouched['creatinineSlope'] ? (this.scoreErrors()['creatinineSlope'] ?? '') : ''; }
  get scoreTacrolimusVariabilityError() { return this.scoreTouched['tacrolimusVariability'] ? (this.scoreErrors()['tacrolimusVariability'] ?? '') : ''; }

  get scoreFormValid() { return Object.keys(this.scoreErrors()).length === 0; }

  saveScore() {
    [
      'patientId',
      'survivalProbability1Year', 'survivalProbability3Year', 'survivalProbability5Year',
      'eGFRSlope', 'creatinineSlope', 'rejectionEpisodeCount', 'tacrolimusVariability'
    ].forEach(f => this.touchScore(f));
    if (Object.keys(this.scoreErrors()).length > 0) return;
    const call = this.editScoreMode && this.editScoreId !== null
      ? this.svc.updateScore(this.editScoreId, this.newScore)
      : this.svc.createScore(this.newScore);
    call.subscribe({ next: () => { this.loadAll(); this.closeScoreForm(); }, error: err => console.error(err) });
  }

  // ── Score filters ──────────────────────────────────────────────────────────
  scorePatientFilter = '';
  scoreRiskFilter    = '';

  get filteredScores(): GraftSurvivalScore[] {
    const patFilter = this.effectivePatientFilter;
    if (patFilter === null) return [];
    let r = [...this.scores];
    if (patFilter !== '') r = r.filter(s => s.patientId.trim().toLowerCase() === patFilter);
    if (this.scoreRiskFilter) r = r.filter(s => s.riskLevel === this.scoreRiskFilter);
    return r.sort((a, b) =>
      new Date(b.calculatedAt || '').getTime() - new Date(a.calculatedAt || '').getTime()
    );
  }

  // ── Survival score helpers ─────────────────────────────────────────────────
  getRiskColour(risk: string): { color: string; bg: string; border: string } {
    if (risk === 'CRITICAL') return { color: '#991b1b', bg: '#fef2f2', border: '#fca5a5' };
    if (risk === 'HIGH')     return { color: '#9a3412', bg: '#fff7ed', border: '#fed7aa' };
    if (risk === 'MODERATE') return { color: '#92400e', bg: '#fffbeb', border: '#fcd34d' };
    return                          { color: '#166534', bg: '#f0fdf4', border: '#86efac' };
  }

  getProbabilityBar(val: number | null): number {
    if (val === null) return 0;
    return Math.round(val * 100);
  }

  getProbabilityColor(val: number | null): string {
    const pct = val !== null ? val * 100 : 0;
    if (pct >= 80) return '#10b981';
    if (pct >= 60) return '#84cc16';
    if (pct >= 40) return '#f59e0b';
    return '#ef4444';
  }

  /**
   * Core computation: derives survival probabilities from recent eGFR trend.
   * Called both by triggerAutoScore() (via modal) and can still be called directly.
   */
  computeScoreFromEntries(patientId: string) {
    const patientEntries = this.entries
      .filter(e => e.patientId === patientId && e.eGFR !== null)
      .sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime());
    const ref = this.refs.find(r => r.patientId === patientId);
    if (patientEntries.length < 2) return;
    const recent = patientEntries.slice(-6);
    const n      = recent.length;
    const xMean  = (n - 1) / 2;
    const yMean  = recent.reduce((s, e) => s + (e.eGFR ?? 0), 0) / n;
    let num = 0, den = 0;
    recent.forEach((e, i) => {
      num += (i - xMean) * ((e.eGFR ?? 0) - yMean);
      den += (i - xMean) * (i - xMean);
    });
    const slope      = den !== 0 ? num / den : 0;
    const latestEGFR = recent[n - 1].eGFR ?? 0;
    const baselineEGFR = ref?.baselineEGFR ?? latestEGFR;
    const pctDrop    = baselineEGFR > 0 ? ((baselineEGFR - latestEGFR) / baselineEGFR) * 100 : 0;
    const base1y = Math.max(0, Math.min(1, 1 - pctDrop / 150));
    const base3y = Math.max(0, Math.min(1, base1y - Math.abs(slope) * 0.05));
    const base5y = Math.max(0, Math.min(1, base3y - Math.abs(slope) * 0.08));
    const risk   = base1y >= 0.8 ? 'LOW' : base1y >= 0.6 ? 'MODERATE' : base1y >= 0.4 ? 'HIGH' : 'CRITICAL';
    this.newScore = {
      patientId,
      survivalProbability1Year: Math.round(base1y * 100) / 100,
      survivalProbability3Year: Math.round(base3y * 100) / 100,
      survivalProbability5Year: Math.round(base5y * 100) / 100,
      riskLevel: risk,
      eGFRSlope: Math.round(slope * 100) / 100,
      creatinineSlope: null, rejectionEpisodeCount: 0,
      hasAcuteDecline:   pctDrop > 25,
      hasChronicDecline: pctDrop > 10,
      tacrolimusVariability: null,
      calculationModel: 'AUTO_EGFR_SLOPE',
      notes: `Auto-computed from ${n} eGFR readings. eGFR slope: ${slope.toFixed(2)} mL/min/measurement.`
    };
    this.showScoreForm = true;
    this.editScoreMode = false;
    this.editScoreId   = null;
    this.scoreTouched  = {};
  }

  // ── Threshold suggestions ──────────────────────────────────────────────────
  get thresholdSuggestions(): { creatinineRisePercent: number | null; eGFRDropPercent: number | null; reason: string } {
    const pid = this.normalizePatientId(this.newThreshold.patientId);
    if (!pid) return { creatinineRisePercent: null, eGFRDropPercent: null, reason: 'Select a patient to see suggestions.' };

    const ref = this.refs.find(r => this.normalizePatientId(r.patientId) === pid);
    if (!ref) return { creatinineRisePercent: null, eGFRDropPercent: null, reason: 'No baseline reference values found for this patient.' };

    const patientEntries = this.entries
      .filter(e => this.normalizePatientId(e.patientId) === pid)
      .sort((a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime())
      .slice(0, 6);

    let cRise: number | null = null;
    if (ref.baselineCreatinine && ref.baselineCreatinine > 0) {
      const rises = patientEntries
        .filter(e => e.creatinine !== null && e.creatinine !== undefined)
        .map(e => ((Number(e.creatinine) - ref.baselineCreatinine!) / ref.baselineCreatinine!) * 100)
        .filter(p => Number.isFinite(p));
      cRise = rises.length ? Math.max(5, Math.min(150, Math.round(Math.max(...rises)))) : null;
    }

    let gDrop: number | null = null;
    if (ref.baselineEGFR && ref.baselineEGFR > 0) {
      const drops = patientEntries
        .filter(e => e.eGFR !== null && e.eGFR !== undefined)
        .map(e => ((ref.baselineEGFR! - Number(e.eGFR)) / ref.baselineEGFR!) * 100)
        .filter(p => Number.isFinite(p));
      gDrop = drops.length ? Math.max(5, Math.min(150, Math.round(Math.max(...drops)))) : null;
    }

    return {
      creatinineRisePercent: cRise,
      eGFRDropPercent: gDrop,
      reason: `Suggestions computed from the latest ${patientEntries.length} entries compared to baseline.`
    };
  }

  applyThresholdSuggestions() {
    const s = this.thresholdSuggestions;
    if (s.creatinineRisePercent !== null) this.newThreshold.creatinineRisePercent = s.creatinineRisePercent;
    if (s.eGFRDropPercent !== null) this.newThreshold.eGFRDropPercent = s.eGFRDropPercent;
    this.touchThr('creatinineRisePercent');
    this.touchThr('eGFRDropPercent');
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  get todayIso(): string { return new Date().toISOString().split('T')[0]; }

  public csvEscape(v: any): string {
    const s = (v ?? '').toString();
    if (s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
    if (s.includes(',') || s.includes('\n') || s.includes('\r')) return `"${s}"`;
    return s;
  }

  downloadFilteredEntriesCsv() {
    const header = [
      'patientId', 'measurementDate', 'collectionType', 'creatinine', 'eGFR',
      'urineOutput', 'tacrolimusLevel', 'systolicBP', 'diastolicBP',
      'weight', 'temperature', 'alertLevel', 'notes'
    ];
    const rows = this.filteredEntries.map(e => {
      const alertLevel = this.getEntryAlertLevel(e)?.level ?? '';
      return [
        this.normalizePatientId(e.patientId), e.measurementDate, e.collectionType ?? '',
        e.creatinine ?? '', e.eGFR ?? '', e.urineOutput ?? '', e.tacrolimusLevel ?? '',
        e.systolicBP ?? '', e.diastolicBP ?? '', e.weight ?? '', e.temperature ?? '',
        alertLevel, e.notes ?? ''
      ].map(v => this.csvEscape(v)).join(',');
    });
    const csv  = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `graft_entries_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  fmtDate(iso?: string): string {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return iso; }
  }

  collectionBadge(type: string): { color: string; bg: string } {
    if (type === 'URGENT')      return { color: '#991b1b', bg: '#fef2f2' };
    if (type === 'POST_BIOPSY') return { color: '#5b21b6', bg: '#ede9fe' };
    return                             { color: '#1565a8', bg: '#e8f4fd' };
  }

  showProfileMenu = false;

  logout() { this.auth.logout(); }

  get groupedEntries(): { patientId: string; entries: GraftFunctionEntry[] }[] {
    const map = new Map<string, GraftFunctionEntry[]>();
    this.filteredEntries.forEach(e => {
      if (!map.has(e.patientId)) map.set(e.patientId, []);
      map.get(e.patientId)!.push(e);
    });
    return Array.from(map.entries()).map(([patientId, entries]) => ({
      patientId,
      entries: entries.sort((a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime())
    }));
  }

  expandedPatients: Record<string, boolean> = {};

  togglePatient(patientId: string) {
    this.expandedPatients[patientId] = !this.expandedPatients[patientId];
  }

  get compareBestMatch(): boolean {
  return this.compareResults.length === 1;
}

  
}