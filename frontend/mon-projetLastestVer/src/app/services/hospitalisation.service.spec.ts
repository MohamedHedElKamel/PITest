import { TestBed } from '@angular/core/testing';

import { HospitalisationService } from './hospitalisation.service';

describe('Hospitalisation', () => {
  let service: HospitalisationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HospitalisationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
