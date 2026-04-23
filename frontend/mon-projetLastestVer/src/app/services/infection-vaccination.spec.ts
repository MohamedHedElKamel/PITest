import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InfectionVaccinationService, Infection, Vaccination } from './infection-vaccination';

describe('InfectionVaccinationService', () => {
  let service: InfectionVaccinationService;
  let httpMock: HttpTestingController;
  const BASE = 'http://localhost:8095';

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(InfectionVaccinationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should fetch all infections', () => {
    const dummyInfections: Infection[] = [{ id: 1, type: 'UTI', detectionDate: '2025-01-01', severity: 'Moderate', patientName: 'john' }];
    service.getAllInfections().subscribe(data => expect(data).toEqual(dummyInfections));
    const req = httpMock.expectOne(`${BASE}/infections`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyInfections);
  });

  it('should delete vaccination', () => {
    service.deleteVaccination(42).subscribe();
    const req = httpMock.expectOne(`${BASE}/vaccinations/42`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});