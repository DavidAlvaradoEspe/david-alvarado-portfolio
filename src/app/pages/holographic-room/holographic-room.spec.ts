import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HolographicRoom } from './holographic-room';

describe('HolographicRoom', () => {
  let component: HolographicRoom;
  let fixture: ComponentFixture<HolographicRoom>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HolographicRoom]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HolographicRoom);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
