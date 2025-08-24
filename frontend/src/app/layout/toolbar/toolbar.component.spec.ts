import { TestBed } from '@angular/core/testing';
import { Toolbar } from './toolbar.component';
import { Auth } from '../../auth/auth.service';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

describe('Toolbar', () => {
  let component: Toolbar;
  let fixture: ReturnType<typeof TestBed.createComponent<Toolbar>>;
  let authServiceMock: { isAuthenticated: jasmine.Spy, logout: jasmine.Spy };

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(true),
      logout: jasmine.createSpy('logout')
    };
    TestBed.configureTestingModule({
      imports: [Toolbar],
      providers: [
        { provide: Auth, useValue: authServiceMock },
        { provide: ActivatedRoute, useValue: {} }
      ]
    });
    fixture = TestBed.createComponent(Toolbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a routerLink to /dashboard/main for the logo', () => {
    const logo = fixture.nativeElement.querySelector('a');
    expect(logo.getAttribute('href')).toBe('/dashboard/main');
  });

  it('should have a routerLink to /dashboard/main for the Home button', () => {
    const homeButton = fixture.nativeElement.querySelectorAll('a')[1];
    expect(homeButton.getAttribute('href')).toBe('/dashboard/main');
  });

  it('should display login and sign up buttons when not authenticated', () => {
    authServiceMock.isAuthenticated.and.returnValue(false);
    fixture = TestBed.createComponent(Toolbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const loginButton = fixture.debugElement.query(By.css('a[routerLink="/"]'));
    const signupButton = fixture.debugElement.query(By.css('a[routerLink="/signup"]'));
    expect(loginButton).toBeTruthy();
    expect(signupButton).toBeTruthy();
  });

  it('should display logout button when authenticated', () => {
    authServiceMock.isAuthenticated.and.returnValue(true);
    fixture = TestBed.createComponent(Toolbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const logoutButton = fixture.debugElement.query(By.css('button'));
    expect(logoutButton).toBeTruthy();
    expect(logoutButton.nativeElement.textContent).toContain('Logout');
  });

  it('should call logout on button click', () => {
    authServiceMock.isAuthenticated.and.returnValue(true);
    fixture = TestBed.createComponent(Toolbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const logoutButton = fixture.debugElement.query(By.css('button'));
    logoutButton.triggerEventHandler('click', null);
    expect(authServiceMock.logout).toHaveBeenCalled();
  });
});
