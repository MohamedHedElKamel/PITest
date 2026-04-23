import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Hospitalisation } from './hospitalisation';

describe('Hospitalisation', () => {
  let component: Hospitalisation;
  let fixture: ComponentFixture<Hospitalisation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Hospitalisation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Hospitalisation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
