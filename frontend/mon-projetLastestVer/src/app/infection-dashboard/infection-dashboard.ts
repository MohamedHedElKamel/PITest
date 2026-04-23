import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  InfectionVaccinationService,
  Infection,
  Vaccination
} from '../services/infection-vaccination';

@Component({
  selector: 'app-infection-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './infection-dashboard.html',
  styleUrls: ['./infection-dashboard.css']
})
export class InfectionDashboardComponent implements OnInit, OnDestroy {

  infections:   Infection[]   = [];
  vaccinations: Vaccination[] = [];
  lastRefreshed = new Date();
  apiError      = '';

  private refreshInterval: any;

  activeSidebarItem = 'overview';

  readonly severityLevels = ['Asymptomatic','Mild','Moderate','Severe','Critical'];
  readonly severityColors: Record<string, string> = {
    Asymptomatic: '#22c55e', Mild: '#84cc16', Moderate: '#f59e0b',
    Severe: '#ef4444', Critical: '#7f1d1d'
  };

  constructor(private svc: InfectionVaccinationService) {}

  ngOnInit() {
    this.loadData();
    this.refreshInterval = setInterval(() => this.loadData(), 30000);
  }
  ngOnDestroy() { clearInterval(this.refreshInterval); }

  // ── Data loading ─────────────────────────────────────────────────────────
  loadData() {
    this.apiError = '';

    this.svc.getAllInfections().subscribe({
      next:  data => { this.infections = data; this.lastRefreshed = new Date(); },
      error: err  => {
        this.apiError = 'Cannot reach backend at localhost:8095. Make sure the server is running.';
        console.error(err);
      }
    });

    this.svc.getAllVaccinations().subscribe({
      next:  data => {
        this.vaccinations = data.map(v => ({ ...v, booster_taken: v.booster_taken ?? false }));
        this.lastRefreshed = new Date();
      },
      error: err => console.error('Vaccinations error:', err)
    });
  }

  manualRefresh() { this.loadData(); }

  exportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      infections: this.infections,
      vaccinations: this.vaccinations,
      summary: {
        totalInfections:   this.totalInfections,
        criticalCount:     this.criticalCount,
        totalVaccinations: this.totalVaccinations,
        vaccinationScore:  this.vaccinationScore,
        boosterScore:      this.boosterScore,
        overdueVaccines:   this.overdueVaccinations.length,
        overdueBoosters:   this.overdueBoosterList.length
      }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), {
      href: url, download: `infection-report-${new Date().toISOString().split('T')[0]}.json`
    });
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Infection stats ───────────────────────────────────────────────────────
  get totalInfections()  { return this.infections.length; }
  get criticalCount()    { return this.infections.filter(i => i.severity === 'Critical' || i.severity === 'Severe').length; }
  get recentInfectionCount() {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    return this.infections.filter(i => new Date(i.detectionDate) >= cutoff).length;
  }

  get recentInfections(): Infection[] {
    return [...this.infections]
      .sort((a, b) => b.detectionDate.localeCompare(a.detectionDate))
      .slice(0, 6);
  }

  get severityDistribution() {
    const total = this.infections.length || 1;
    return this.severityLevels.map(s => ({
      label: s,
      count: this.infections.filter(i => i.severity === s).length,
      color: this.severityColors[s],
      pct:   Math.round(this.infections.filter(i => i.severity === s).length / total * 100)
    }));
  }

  get infectionsByMonth() {
    const now = new Date();
    const months: string[] = [];
    for (let m = 0; m <= now.getMonth(); m++)
      months.push(`${now.getFullYear()}-${String(m+1).padStart(2,'0')}`);
    const entries = months.map(k => ({
      month: k,
      count: this.infections.filter(i => i.detectionDate?.slice(0,7) === k).length
    }));
    const max = Math.max(...entries.map(e => e.count), 1);
    return entries.map(e => ({ ...e, barPct: Math.round(e.count / max * 100) }));
  }

  get topInfectionTypes() {
    const freq: Record<string,number> = {};
    this.infections.forEach(i => freq[i.type] = (freq[i.type] ?? 0) + 1);
    const total = this.infections.length || 1;
    return Object.entries(freq)
      .sort((a,b) => b[1] - a[1]).slice(0,5)
      .map(([type, count]) => ({ type, count, pct: Math.round(count / total * 100) }));
  }

  // ── Vaccination stats ─────────────────────────────────────────────────────
  get totalVaccinations() { return this.vaccinations.length; }
  get takenCount()        { return this.vaccinations.filter(v => v.taken).length; }
  get notTakenCount()     { return this.vaccinations.filter(v => !v.taken).length; }

  get vaccinationScore(): number {
    if (!this.vaccinations.length) return 0;
    return Math.round(this.takenCount / this.vaccinations.length * 100);
  }

  get vaccinationsWithBooster() { return this.vaccinations.filter(v => !!v.booster_date); }
  get boosterTakenCount()       { return this.vaccinations.filter(v => v.booster_taken).length; }
  get boosterPendingCount()     { return this.vaccinationsWithBooster.filter(v => !v.booster_taken).length; }
  get boosterScore(): number {
    const t = this.vaccinationsWithBooster.length;
    return t ? Math.round(this.boosterTakenCount / t * 100) : 0;
  }

  get linkedVaccinationCount()   { return this.vaccinations.filter(v => v.infectionId !== null).length; }
  get unlinkedVaccinationCount() { return this.vaccinations.filter(v => v.infectionId === null).length; }

  get infectionsCoveredByVaccine() {
    const ids = new Set(this.vaccinations.map(v => v.infectionId).filter(id => id !== null));
    return ids.size;
  }
  get infectionsCoveragePercent() {
    return this.totalInfections ? Math.round(this.infectionsCoveredByVaccine / this.totalInfections * 100) : 0;
  }

  private todayStr() {
    const d = new Date(); d.setHours(0,0,0,0);
    return d.toISOString().split('T')[0];
  }

  get overdueVaccinations() {
    const today = this.todayStr();
    return this.vaccinations.filter(v => !v.taken && v.vaccination_date && v.vaccination_date < today);
  }
  get overdueBoosterList() {
    const today = this.todayStr();
    return this.vaccinations.filter(v => !v.booster_taken && v.booster_date && v.booster_date < today);
  }
  get upcomingVaccinations() {
    const today = new Date(); today.setHours(0,0,0,0);
    const in7   = new Date(); in7.setDate(in7.getDate()+7); in7.setHours(0,0,0,0);
    return this.vaccinations
      .filter(v => {
        if (v.taken || !v.vaccination_date) return false;
        const d = new Date(v.vaccination_date); d.setHours(0,0,0,0);
        return d >= today && d <= in7;
      })
      .sort((a,b) => a.vaccination_date.localeCompare(b.vaccination_date));
  }
  get upcomingBoosters() {
    const today = new Date(); today.setHours(0,0,0,0);
    const in7   = new Date(); in7.setDate(in7.getDate()+7); in7.setHours(0,0,0,0);
    return this.vaccinations
      .filter(v => {
        if (v.booster_taken || !v.booster_date) return false;
        const d = new Date(v.booster_date); d.setHours(0,0,0,0);
        return d >= today && d <= in7;
      })
      .sort((a,b) => a.booster_date.localeCompare(b.booster_date));
  }

  // ── Alerts ────────────────────────────────────────────────────────────────
  get alerts(): { level: 'critical'|'warning'|'info'; message: string }[] {
    const out: { level: 'critical'|'warning'|'info'; message: string }[] = [];
    if (this.criticalCount > 0)
      out.push({ level:'critical', message:`${this.criticalCount} infection(s) rated Severe or Critical.` });
    if (this.overdueVaccinations.length > 0)
      out.push({ level:'critical', message:`${this.overdueVaccinations.length} vaccination(s) are overdue.` });
    if (this.overdueBoosterList.length > 0)
      out.push({ level:'warning',  message:`${this.overdueBoosterList.length} booster dose(s) are overdue.` });
    if (this.upcomingVaccinations.length > 0)
      out.push({ level:'warning',  message:`${this.upcomingVaccinations.length} vaccination(s) due within 7 days.` });
    if (this.upcomingBoosters.length > 0)
      out.push({ level:'info',     message:`${this.upcomingBoosters.length} booster(s) due within 7 days.` });
    if (this.vaccinationScore < 50 && this.totalVaccinations > 0)
      out.push({ level:'warning',  message:`Vaccination compliance below 50% (${this.vaccinationScore}/100).` });
    if (this.recurringTypes.length > 0)
      out.push({ level:'warning',  message:`${this.recurringTypes.length} infection type(s) have recurred.` });
    return out;
  }

  daysUntil(dateStr: string): number {
    const today = new Date(); today.setHours(0,0,0,0);
    const d     = new Date(dateStr); d.setHours(0,0,0,0);
    return Math.round((d.getTime() - today.getTime()) / 86400000);
  }

  getSeverityColor(s: string)       { return this.severityColors[s] ?? '#94a3b8'; }
  getScoreColor(score: number)      { return score >= 75 ? '#10b981' : score >= 50 ? '#84cc16' : score >= 25 ? '#f59e0b' : '#ef4444'; }
  getProgressGradient(score: number) {
    if (score <= 25) return 'linear-gradient(90deg,#ef4444,#f97316)';
    if (score <= 50) return 'linear-gradient(90deg,#f97316,#f59e0b)';
    if (score <= 75) return 'linear-gradient(90deg,#f59e0b,#84cc16)';
    return                  'linear-gradient(90deg,#22c55e,#10b981)';
  }
  getInfectionName(id: number | null) {
    if (id === null) return 'Standalone';
    return this.infections.find(i => i.id === id)?.type ?? 'Unknown';
  }
  isVaccinatedForInfection(infId: number) {
    return this.vaccinations.some(v => v.infectionId === infId);
  }

  // ── SVG chart helpers ─────────────────────────────────────────────────────
  private readonly CW = 560; private readonly CH = 140;
  private readonly CPX = 24; private readonly CPY = 14;

  private getMonthsRange() {
    const now = new Date();
    const months: string[] = [];
    for (let m = 0; m <= now.getMonth(); m++)
      months.push(`${now.getFullYear()}-${String(m+1).padStart(2,'0')}`);
    return months;
  }

  private toSvgCoords(values: number[], maxVal: number) {
    const n = values.length; const bottom = this.CH - this.CPY; const top = this.CPY;
    return values.map((v, i) => ({
      x: this.CPX + (n === 1 ? 256 : (i / (n-1))) * (this.CW - this.CPX*2),
      y: v === 0 ? bottom - 4 : top + (1 - Math.min(v/maxVal,1)) * (bottom - top)
    }));
  }

  getSvgLinePath(values: number[], maxVal: number) {
    return this.toSvgCoords(values, maxVal).map((p,i) => `${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ');
  }
  getSvgAreaPath(values: number[], maxVal: number) {
    const pts = this.toSvgCoords(values, maxVal); const bottom = this.CH - this.CPY;
    const line = pts.map((p,i) => `${i===0?'M':'L'} ${p.x} ${p.y}`).join(' ');
    return `${line} L ${pts[pts.length-1].x} ${bottom} L ${pts[0].x} ${bottom} Z`;
  }
  getSvgDots(values: number[], maxVal: number) {
    return this.toSvgCoords(values, maxVal).map((p,i) => ({ ...p, val: values[i] }));
  }
  getSvgGridY(maxVal: number) {
    return Array.from({ length: 5 }, (_, i) => {
      const frac = i / 4;
      return { y: this.CPY + (1-frac)*(this.CH - this.CPY*2), label: Math.round(frac*maxVal) };
    });
  }

  get trendChartData() {
    const months    = this.getMonthsRange();
    const infLine   = months.map(m => this.infections.filter(i => i.detectionDate?.slice(0,7)    === m).length);
    const vacLine   = months.map(m => this.vaccinations.filter(v => v.vaccination_date?.slice(0,7) === m).length);
    const boostLine = months.map(m => this.vaccinations.filter(v => v.booster_date?.slice(0,7)     === m).length);
    return { months, infLine, vacLine, boostLine, maxVal: Math.max(...infLine, ...vacLine, ...boostLine, 1) };
  }

  get cumulativeChart() {
    const months = this.getMonthsRange();
    const values = months.map(m => this.infections.filter(i => i.detectionDate?.slice(0,7) <= m).length);
    return { months, values, maxVal: Math.max(...values, 1) };
  }

  get complianceTrend() {
    const months   = this.getMonthsRange();
    const vacPct   = months.map(m => {
      const s = this.vaccinations.filter(v => v.vaccination_date?.slice(0,7) === m);
      return s.length ? Math.round(s.filter(v => v.taken).length / s.length * 100) : 0;
    });
    const boostPct = months.map(m => {
      const s = this.vaccinations.filter(v => v.booster_date?.slice(0,7) === m);
      return s.length ? Math.round(s.filter(v => v.booster_taken).length / s.length * 100) : 0;
    });
    return { months, vacPct, boostPct };
  }

  get severityTrendData() {
    const months   = this.getMonthsRange();
    const critical = months.map(m => this.infections.filter(i => i.detectionDate?.slice(0,7)===m && i.severity==='Critical').length);
    const severe   = months.map(m => this.infections.filter(i => i.detectionDate?.slice(0,7)===m && i.severity==='Severe').length);
    const mild     = months.map(m => this.infections.filter(i => i.detectionDate?.slice(0,7)===m && (i.severity==='Mild'||i.severity==='Asymptomatic')).length);
    return { months, critical, severe, mild, maxVal: Math.max(...critical.map((c,i)=>c+severe[i]+mild[i]), 1) };
  }

  formatMonthLabel(m: string) {
    const [year, month] = m.split('-');
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(month)-1] + ' ' + year.slice(2);
  }

  get cumulativeChartHasData() { return this.cumulativeChart.values.some(v => v > 0); }
  get cumulativeChartEmpty()   { return !this.cumulativeChartHasData; }
  get complianceTrendHasData() { return this.complianceTrend.months.length >= 2; }
  get complianceTrendEmpty()   { return !this.complianceTrendHasData; }

  // ── Recurrence & predictions ──────────────────────────────────────────────
  get recurrenceMap(): Record<string, Infection[]> {
    const map: Record<string, Infection[]> = {};
    for (const inf of this.infections) {
      const key = `${(inf.patientName||'').trim().toLowerCase()}::${inf.type.trim().toLowerCase()}`;
      (map[key] = map[key] ?? []).push(inf);
    }
    return map;
  }

  get recurringTypes() {
    return Object.entries(this.recurrenceMap)
      .filter(([,list]) => list.length > 1)
      .map(([,list]) => ({
        type: list[0].type, patient: list[0].patientName||'',
        count: list.length,
        infections: [...list].sort((a,b) => new Date(a.detectionDate).getTime()-new Date(b.detectionDate).getTime())
      }))
      .sort((a,b) => b.count - a.count);
  }

  get allPredictions() {
    return this.recurringTypes.map(rec => ({ ...rec, prediction: this.getPrediction(rec) }));
  }

  private avgDaysBetween(infs: Infection[]): number {
    if (infs.length < 2) return 0;
    const s = [...infs].sort((a,b) => new Date(a.detectionDate).getTime()-new Date(b.detectionDate).getTime());
    let total = 0;
    for (let i=1; i<s.length; i++)
      total += Math.round((new Date(s[i].detectionDate).getTime()-new Date(s[i-1].detectionDate).getTime())/86400000);
    return Math.round(total / (s.length-1));
  }

  getPrediction(rec: { type: string; count: number; infections: Infection[] }) {
    const sorted  = [...rec.infections].sort((a,b) => new Date(a.detectionDate).getTime()-new Date(b.detectionDate).getTime());
    const avgDays = this.avgDaysBetween(sorted);
    const reasons: string[] = [];
    let chance    = Math.min(25 + (rec.count-1)*18, 88);
    reasons.push(`${rec.count} episodes give a base probability of ${chance}%.`);

    if (avgDays > 0 && avgDays <= 30)       { chance = Math.min(chance+12,95); reasons.push(`Very frequent (avg ${avgDays}d) — +12%.`); }
    else if (avgDays > 30 && avgDays <= 90) { chance = Math.min(chance+6,95);  reasons.push(`Moderate frequency (avg ${avgDays}d) — +6%.`); }
    else if (avgDays > 180)                 { chance = Math.max(chance-10,10); reasons.push(`Episodes far apart (avg ${avgDays}d) — -10%.`); }
    else if (avgDays > 0)                   { reasons.push(`Average interval: ${avgDays} days.`); }

    const sevOrder = ['Asymptomatic','Mild','Moderate','Severe','Critical'];
    const lastSev  = sevOrder.indexOf(sorted[sorted.length-1].severity);
    const firstSev = sevOrder.indexOf(sorted[0].severity);
    if (lastSev > firstSev)      { chance = Math.min(chance+8,95); reasons.push(`Severity escalating — +8%.`); }
    else if (lastSev < firstSev) { chance = Math.max(chance-6,10); reasons.push(`Severity improving — -6%.`); }

    const linked = this.vaccinations.find(v =>
      v.infectionId !== null && rec.infections.some(i => i.id === v.infectionId));
    if (linked) {
      if (linked.taken) {
        const ago = Math.round((Date.now()-new Date(linked.vaccination_date).getTime())/86400000);
        const cut = ago <= 180 ? 30 : 15;
        chance = Math.max(chance-cut,5); reasons.push(`Vaccination taken ${ago}d ago — -${cut}%.`);
        if (linked.booster_taken) { chance = Math.max(chance-10,5); reasons.push(`Booster taken — -10%.`); }
      } else { chance = Math.min(chance+10,95); reasons.push(`Linked vaccination not yet taken — +10%.`); }
    } else { chance = Math.min(chance+8,95); reasons.push(`No linked vaccination — +8%.`); }

    const variance = Math.max(Math.round((avgDays||90)*0.22),7);
    const mid = new Date(sorted[sorted.length-1].detectionDate);
    mid.setDate(mid.getDate()+(avgDays||90));
    const early = new Date(mid); early.setDate(early.getDate()-variance);
    const late  = new Date(mid); late.setDate(late.getDate()+variance);
    const fmt   = (d: Date) => d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
    reasons.push(`Window: last episode + avg interval ± ${variance}d.`);
    let label = 'Low'; let color = '#eab308';
    if (chance >= 70)      { label='High';     color='#ef4444'; }
    else if (chance >= 45) { label='Moderate'; color='#f97316'; }
    return { chance, earliest: fmt(early), latest: fmt(late), label, color, reasons };
  }
}