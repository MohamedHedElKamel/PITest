import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { InfectionVaccinationComponent } from './infection-vaccination';
import { InfectionVaccinationService, Infection, Vaccination } from '../services/infection-vaccination';
import { AuthRoleService } from '../services/auth-role.service';

describe('InfectionVaccinationComponent', () => {
  let component: InfectionVaccinationComponent;
  let fixture: ComponentFixture<InfectionVaccinationComponent>;
  let mockSvc: Partial<InfectionVaccinationService>;
  let mockAuth: Partial<AuthRoleService>;

  const mockInfections: Infection[] = [
    { id: 1, type: 'UTI', detectionDate: '2024-12-01', severity: 'Moderate', patientName: 'p1' },
    { id: 2, type: 'UTI', detectionDate: '2025-01-10', severity: 'Severe', patientName: 'p1' },
    { id: 3, type: 'CMV', detectionDate: '2024-11-15', severity: 'Mild', patientName: 'p1' }
  ];

  const mockVaccinations: Vaccination[] = [
    { id: 1, name: 'Influenza', vaccination_date: '2025-01-01', patientName: 'p1', booster_date: '', infectionId: null, taken: true, booster_taken: false },
    { id: 2, name: 'MMR', vaccination_date: '2024-10-01', patientName: 'p1', booster_date: '', infectionId: null, taken: false, booster_taken: false }
  ];

  beforeEach(async () => {
    // Create mock service with plain methods (no Jasmine spies)
    mockSvc = {
      getAllInfections: () => of(mockInfections),
      getAllVaccinations: () => of(mockVaccinations),
      createInfection: () => of({} as Infection),
      updateInfection: () => of({} as Infection),
      deleteInfection: () => of(),
      createVaccination: () => of({} as Vaccination),
      deleteVaccination: () => of(),
      getVaccinationsByInfection: () => of([])
    };

    mockAuth = {
      isMedecin: () => false,
      isPatient: () => true,
      getUsername: () => 'p1',
      getPatientUsers: () => of([]),
      logout: () => {}
    };

    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [InfectionVaccinationComponent],
      providers: [
        { provide: InfectionVaccinationService, useValue: mockSvc },
        { provide: AuthRoleService, useValue: mockAuth }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InfectionVaccinationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ----- Recurrence prediction complex logic -----
  describe('Recurrence prediction', () => {
    it('should compute average days between episodes', () => {
      const utiInfections = mockInfections.filter(i => i.type === 'UTI');
      const avg = component.getAvgDaysBetween(utiInfections);
      // from 2024-12-01 to 2025-01-10 = 40 days, only one gap => avg = 40
      expect(avg).toBe(40);
    });

    it('should calculate recurrence chance with escalation', () => {
      const rec = {
        type: 'UTI', count: 2,
        infections: [
          { id: 1, type: 'UTI', detectionDate: '2024-12-01', severity: 'Moderate', patientName: 'p1' },
          { id: 2, type: 'UTI', detectionDate: '2025-01-10', severity: 'Severe', patientName: 'p1' }
        ]
      };
      const pred = component.getPrediction(rec as any);
      expect(pred.chance).toBeGreaterThan(25); // base 25+18 =43, then +8 for severity escalation => 51
      expect(pred.label).toBe('Moderate');
    });

    it('should adjust chance when linked vaccination exists', () => {
      // Add a linked vaccination not taken
      component.vaccinations = [{ ...mockVaccinations[0], infectionId: 1, taken: false }];
      const rec = { type: 'UTI', count: 1, infections: [mockInfections[0]] };
      const pred = component.getPrediction(rec as any);
      expect(pred.chance).toBeGreaterThan(25); // +10 for missing vaccine
    });
  });

  // ----- Vaccination interaction rules -----
  describe('Vaccination interaction warnings', () => {
    beforeEach(() => {
      component.vaccinations = [
        { id: 99, name: 'MMR', vaccination_date: '2025-01-01', patientName: 'p1', booster_date: '', infectionId: null, taken: true, booster_taken: false } as Vaccination
      ];
      component.newVaccination.name = 'Varicella';
      component.newVaccination.vaccination_date = '2025-01-15';
    });

    it('should detect MMR-Varicella conflict (<28 days)', () => {
      const warnings = component.vacInteractionWarnings;
      expect(warnings.length).toBe(1);
      expect(warnings[0].severity).toBe('critical');
      expect(warnings[0].message).toContain('MMR');
    });

    it('should not warn if gap >= 28 days', () => {
      component.newVaccination.vaccination_date = '2025-01-30'; // 29 days later
      expect(component.vacInteractionWarnings.length).toBe(0);
    });
  });

  // ----- Contraindication rules based on infection severity -----
  describe('Contraindication warnings', () => {
    beforeEach(() => {
      component.newVaccination.name = 'MMR';
      component.newVaccination.infectionId = 1; // UTI with Moderate severity
      component.infections = mockInfections;
    });

    it('should warn for live vaccine with Severe/Critical infection', () => {
      const severeInf = { ...mockInfections[0], severity: 'Severe' };
      component.infections = [severeInf];
      const warns = component.vacContraindicationWarnings;
      expect(warns.some(w => w.message.includes('Live vaccines are contraindicated'))).toBe(true);
    });

    it('should not warn for Mild infection', () => {
      component.infections = [{ ...mockInfections[0], severity: 'Mild' }];
      expect(component.vacContraindicationWarnings.length).toBe(0);
    });
  });

  // ----- Efficacy decay model -----
  describe('Efficacy percentage', () => {
    it('should return 100% within full protection period', () => {
      const vac = { taken: true, vaccination_date: new Date().toISOString().split('T')[0], name: 'Hepatitis B', booster_taken: false, booster_date: '' } as Vaccination;
      expect(component.getEfficacyPercent(vac)).toBe(100);
    });

    it('should decay after half-life', () => {
      // Hepatitis B: full=1825 days, half-life=1095 days. Simulate 5 years later
      const oldDate = new Date(); oldDate.setFullYear(oldDate.getFullYear() - 5);
      const vac = { taken: true, vaccination_date: oldDate.toISOString().split('T')[0], name: 'Hepatitis B', booster_taken: false, booster_date: '' } as Vaccination;
      const pct = component.getEfficacyPercent(vac);
      expect(pct).toBeLessThan(100);
      expect(pct).toBeGreaterThanOrEqual(20); // min protection 20%
    });
  });

  // ----- Effective patient filtering for patient role -----
  describe('effectiveInfectionPatientFilter', () => {
    it('returns username for patient', () => {
      expect(component.effectiveInfectionPatientFilter).toBe('p1');
    });
    it('returns empty string for medecin when no filter', () => {
      // Override auth methods for this test
      (mockAuth.isPatient as any) = () => false;
      (mockAuth.isMedecin as any) = () => true;
      component.infectionPatientFilter = '';
      expect(component.effectiveInfectionPatientFilter).toBe('');
    });
  });
});