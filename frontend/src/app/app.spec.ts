import { TestBed } from '@angular/core/testing';
import { App } from './app.component';
import { Auth } from './auth/auth.service';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder } from '@angular/forms';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: Auth, useValue: { isAuthenticated: () => true } },
        { provide: ActivatedRoute, useValue: {} },
        FormBuilder
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

});
