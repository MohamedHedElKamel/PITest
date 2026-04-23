import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GraftFunctionService, GraftFunctionEntry, ReferenceValue, AlertThreshold, GraftSurvivalScore } from './graft-function';

describe('GraftFunctionService', () => {
  let service: GraftFunctionService;
  let httpMock: HttpTestingController;
  const base = 'http://localhost:8095/api';

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(GraftFunctionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should create entry via POST', () => {
    const dummyEntry: Partial<GraftFunctionEntry> = { patientId: 'p1', measurementDate: '2025-01-01' };
    service.createEntry(dummyEntry).subscribe();
    const req = httpMock.expectOne(`${base}/graft-entries`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dummyEntry);
  });

  it('should handle 404 on getRefByPatient', () => {
    service.getRefByPatient('unknown').subscribe({
      error: err => expect(err.status).toBe(404)
    });
    const req = httpMock.expectOne(`${base}/reference-values/patient/unknown`);
    req.flush('Not found', { status: 404, statusText: 'Not Found' });
  });
});