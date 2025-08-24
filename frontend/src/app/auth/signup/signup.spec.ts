import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Signup } from './signup.component';
import { Auth } from '../auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { HttpClient } from '@angular/common/http';

describe('Signup', () => {
  let component: Signup;
  let fixture: ComponentFixture<Signup>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('Auth', ['signup']);
    await TestBed.configureTestingModule({
      imports: [Signup],
      providers: [
        { provide: Auth, useValue: authSpy },
        { provide: Router, useValue: { createUrlTree: () => ({}), serializeUrl: () => '',
         navigate: jasmine.createSpy('navigate'), events: of() } },
        { provide: ActivatedRoute, useValue: {} },
        { provide: HttpClient, useValue: { post: jasmine.createSpy('post') } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
