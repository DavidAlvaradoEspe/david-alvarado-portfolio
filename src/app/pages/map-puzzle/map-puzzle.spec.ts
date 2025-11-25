import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClosedMap } from './map-puzzle';

describe('ClosedMap', () => {
  let component: ClosedMap;
  let fixture: ComponentFixture<ClosedMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClosedMap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClosedMap);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
