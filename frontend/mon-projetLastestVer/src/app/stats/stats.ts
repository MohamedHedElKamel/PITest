import { Component, OnInit } from '@angular/core';
import { StatsService, StatsDTO } from '../services/stats';  // ← Correction du chemin

@Component({
  selector: 'app-stats',
  standalone: false,
  templateUrl: './stats.html',  // ← Correction
  styleUrls: ['./stats.css']     // ← Correction
})
export class StatsComponent implements OnInit {
  stats: StatsDTO | null = null;  // ← Correction: | null au lieu de = null
  summary: string = '';
  loading = false;
  error: string | null = null;

  // Pour le graphique des admissions par mois
  chartData: any[] = [];
  chartLabels: string[] = [];

  constructor(private statsService: StatsService) {}  // ← Ajout du constructeur

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = null;

    this.statsService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.prepareChartData(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement stats:', err);
        this.error = 'Impossible de charger les statistiques';
        this.loading = false;
      }
    });

    // Optionnel : charger aussi le résumé
    this.statsService.getSummary().subscribe({
      next: (data) => this.summary = data,
      error: (err) => console.error('Erreur résumé:', err)
    });
  }

  prepareChartData(stats: StatsDTO): void {
    // Préparer les données pour le graphique
    this.chartLabels = Object.keys(stats.admissionsByMonth).sort();
    this.chartData = [{
      data: this.chartLabels.map(month => stats.admissionsByMonth[month]),
      label: 'Admissions par mois',
      backgroundColor: '#3b82f6'
    }];
  }

  // Utilitaires pour les stats
  get occupancyRateFormatted(): string {
    return this.stats ? this.stats.occupancyRate.toFixed(1) + '%' : '0%';
  }

  get averageStayFormatted(): string {
    return this.stats ? this.stats.averageStayDuration.toFixed(1) + ' jours' : '0 jour';
  }

  get dailyEvolutionFormatted(): string {
    if (!this.stats) return '0%';
    const value = this.stats.dailyEvolution;
    const sign = value > 0 ? '+' : '';
    return sign + value.toFixed(1) + '%';
  }

  get dailyEvolutionClass(): string {
    if (!this.stats) return '';
    return this.stats.dailyEvolution >= 0 ? 'positive' : 'negative';
  }
  
  getMaxAdmissions(): number {
    if (!this.stats) return 1;
    return Math.max(...Object.values(this.stats.admissionsByMonth));
  }
}