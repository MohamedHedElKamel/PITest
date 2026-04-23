import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { GraftFunctionComponent } from './graft-function';
import { GraftFunctionService, GraftFunctionEntry, ReferenceValue, AlertThreshold, GraftSurvivalScore } from '../services/graft-function';
import { AuthRoleService, PatientUser } from '../services/auth-role.service';

describe('GraftFunctionComponent', () => {
  let component: GraftFunctionComponent;
  let fixture: ComponentFixture<GraftFunctionComponent>;
  let mockGraftSvc: Partial<GraftFunctionService>;
  let mockAuth: Partial<AuthRoleService>;

  const mockEntries: GraftFunctionEntry[] = [
    { id: 1, patientId: 'p1', measurementDate: '2025-01-10', creatinine: 1.2, eGFR: 60, urineOutput: null, tacrolimusLevel: null, systolicBP: null, diastolicBP: null, weight: null, temperature: null, collectionType: 'ROUTINE', notes: '' },
    { id: 2, patientId: 'p1', measurementDate: '2025-01-20', creatinine: 1.5, eGFR: 55, urineOutput: null, tacrolimusLevel: null, systolicBP: null, diastolicBP: null, weight: null, temperature: null, collectionType: 'ROUTINE', notes: '' }
  ];
  const mockRef: ReferenceValue = { id: 1, patientId: 'p1', establishedDate: '2025-01-01', baselineCreatinine: 1.0, baselineEGFR: 70, targetTacrolimusMin: 5, targetTacrolimusMax: 15, targetSystolicBP: 120, targetDiastolicBP: 80, setBy: 'doc', notes: '' };
  const mockThreshold: AlertThreshold = { id: 1, patientId: 'p1', creatinineRisePercent: 25, eGFRDropPercent: 20, creatinineAbsoluteMax: 3.0, eGFRCriticalMin: 20, tacrolimusMin: 5, tacrolimusMax: 15, acuteDeclineLevel: 'WARNING', chronicDeclineLevel: 'WATCH', configuredBy: 'doc' };

  beforeEach(async () => {
    // Create mock service with plain methods (no Jasmine spies)
    mockGraftSvc = {
      getAllEntries: () => of([]),
      getEntriesByPatient: () => of([]),
      createEntry: () => of({} as GraftFunctionEntry),
      updateEntry: () => of({} as GraftFunctionEntry),
      deleteEntry: () => of(),
      getAllRefs: () => of([]),
      getRefByPatient: () => of({} as ReferenceValue),
      createRef: () => of({} as ReferenceValue),
      updateRef: () => of({} as ReferenceValue),
      deleteRef: () => of(),
      getAllThresholds: () => of([]),
      getThresholdByPatient: () => of({} as AlertThreshold),
      createThreshold: () => of({} as AlertThreshold),
      updateThreshold: () => of({} as AlertThreshold),
      deleteThreshold: () => of(),
      getAllScores: () => of([]),
      getScoresByPatient: () => of([]),
      createScore: () => of({} as GraftSurvivalScore),
      updateScore: () => of({} as GraftSurvivalScore),
      deleteScore: () => of()
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
      declarations: [GraftFunctionComponent],
      providers: [
        { provide: GraftFunctionService, useValue: mockGraftSvc },
        { provide: AuthRoleService, useValue: mockAuth },
        ChangeDetectorRef
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GraftFunctionComponent);
    component = fixture.componentInstance;
  });

  // ----- Complex form validation -----
  describe('Entry form validation', () => {
    it('should detect pulse pressure too narrow', () => {
      component.newEntry.systolicBP = 100;
      component.newEntry.diastolicBP = 85; // pulse pressure = 15 < 20
      component.touchEntry('diastolicBP');
      expect(component.entryDiastolicBPError).toContain('Pulse pressure too narrow');
    });

    it('should detect pulse pressure too wide', () => {
      component.newEntry.systolicBP = 150;
      component.newEntry.diastolicBP = 40; // pulse pressure = 110 > 100
      component.touchEntry('diastolicBP');
      expect(component.entryDiastolicBPError).toContain('Pulse pressure too wide');
    });

    it('should detect diastolic > systolic', () => {
      component.newEntry.systolicBP = 110;
      component.newEntry.diastolicBP = 120;
      component.touchEntry('diastolicBP');
      expect(component.entryDiastolicBPError).toContain('must be less than or equal to systolic');
    });
  });

  describe('Reference value validation', () => {
    it('should detect inconsistent eGFR vs creatinine', () => {
      component.newRef.baselineEGFR = 95;
      component.newRef.baselineCreatinine = 3.0;
      component.touchRef('baselineEGFR');
      expect(component.refBaselineEGFRError).toContain('eGFR > 90 is inconsistent with creatinine > 2.5');
    });
  });

  // ----- Alert evaluation -----
  describe('Alert evaluation', () => {
    beforeEach(() => {
      component.refs = [mockRef];
      component.thresholds = [mockThreshold];
    });

    it('should return WARNING alert when creatinine rise exceeds threshold', () => {
      const entry = { ...mockEntries[1], creatinine: 1.4 }; // rise = 40% > 25%
      const alert = component.getEntryAlertLevel(entry);
      expect(alert?.level).toBe('WARNING'); // acuteDeclineLevel from mock
    });

    it('should return null when no ref/threshold', () => {
      component.refs = [];
      expect(component.getEntryAlertLevel(mockEntries[0])).toBeNull();
    });
  });

  // ----- Auto score computation (complex slope & risk) -----
  describe('computeScoreFromEntries', () => {
    beforeEach(() => {
      component.entries = [
        { ...mockEntries[0], eGFR: 70, measurementDate: '2025-01-01' },
        { ...mockEntries[1], eGFR: 60, measurementDate: '2025-01-10' },
        { id: 3, patientId: 'p1', measurementDate: '2025-01-20', eGFR: 55, creatinine: null, urineOutput: null, tacrolimusLevel: null, systolicBP: null, diastolicBP: null, weight: null, temperature: null, collectionType: 'ROUTINE', notes: '' }
      ];
      component.refs = [mockRef];
    });

    it('should compute eGFR slope and set risk level LOW', () => {
      component.computeScoreFromEntries('p1');
      expect(component.newScore.eGFRSlope).toBeCloseTo(-7.5, 1);
      expect(component.newScore.riskLevel).toBe('LOW');
      expect(component.newScore.calculationModel).toBe('AUTO_EGFR_SLOPE');
    });

    it('should not compute if less than 2 entries', () => {
      component.entries = [mockEntries[0]];
      component.computeScoreFromEntries('p1');
      expect(component.newScore.patientId).toBeUndefined();
    });
  });

  // ----- Patient filtering (role‑based) -----
  describe('effectivePatientFilter', () => {
    it('for patient role returns own username lowercased', () => {
      expect(component.effectivePatientFilter).toBe('p1');
    });

    it('for medecin role returns entryPatientFilter', () => {
      // Override auth methods for this test
      (mockAuth.isMedecin as any) = () => true;
      (mockAuth.isPatient as any) = () => false;
      component.entryPatientFilter = 'p2';
      expect(component.effectivePatientFilter).toBe('p2');
    });
  });

  // ----- Comparison modal similarity score -----
  describe('runComparison similarity scoring', () => {
    beforeEach(() => {
      component.entries = [
        { id: 1, patientId: 'ref', measurementDate: '2025-01-01', eGFR: 60, creatinine: 1.2, weight: 70, collectionType: 'ROUTINE', urineOutput: null, tacrolimusLevel: null, systolicBP: null, diastolicBP: null, temperature: null, notes: '' },
        { id: 2, patientId: 'other1', measurementDate: '2025-01-02', eGFR: 55, creatinine: 1.3, weight: 68, collectionType: 'ROUTINE', urineOutput: null, tacrolimusLevel: null, systolicBP: null, diastolicBP: null, temperature: null, notes: '' },
        { id: 3, patientId: 'other2', measurementDate: '2025-01-03', eGFR: 40, creatinine: 2.0, weight: 90, collectionType: 'URGENT', urineOutput: null, tacrolimusLevel: null, systolicBP: null, diastolicBP: null, temperature: null, notes: '' }
      ];
      component.comparePatientId = 'ref';
      component.runComparison();
    });

    it('should compute similarity scores and pick best match', () => {
      expect(component.compareResults.length).toBe(1);
      expect(component.compareResults[0].patientId).toBe('other1');
    });
  });
});