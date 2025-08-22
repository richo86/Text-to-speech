import { TestBed } from '@angular/core/testing';
import { Toolbar } from './toolbar.component';
import { Auth } from '../../auth/auth.service';

describe('Toolbar', () => {
  let component: Toolbar;
  let authService: Auth;

  const authServiceMock = {
    isAuthenticated: () => true,
    logout: () => {},
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
  imports: [Toolbar],
      providers: [{ provide: Auth, useValue: authServiceMock }]
    });
    const fixture = TestBed.createComponent(Toolbar);
    component = fixture.componentInstance;
    authService = TestBed.inject(Auth);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a routerLink to /dashboard/main for the logo', () => {
    const fixture = TestBed.createComponent(Toolbar);
    const logo = fixture.nativeElement.querySelector('a');
    expect(logo.getAttribute('href')).toBe('/dashboard/main');
  });

  it('should have a routerLink to /dashboard/main for the Home button', () => {
    const fixture = TestBed.createComponent(Toolbar);
    const homeButton = fixture.nativeElement.querySelectorAll('a')[1];
    expect(homeButton.getAttribute('href')).toBe('/dashboard/main');
  });
});
