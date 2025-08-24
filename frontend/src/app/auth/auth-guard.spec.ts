import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { authGuard } from './auth.guard';
import { Auth } from './auth.service';

describe('authGuard', () => {
  let authService: { isAuthenticated: jasmine.Spy };
  let router: { navigate: jasmine.Spy };

  beforeEach(() => {
    authService = { isAuthenticated: jasmine.createSpy('isAuthenticated') };
    router = { navigate: jasmine.createSpy('navigate') };
    TestBed.configureTestingModule({
      providers: [
        { provide: Auth, useValue: authService },
        { provide: Router, useValue: router },
      ]
    });
  });

  it('should allow activation when authenticated', () => {
    authService.isAuthenticated.and.returnValue(true);
    const dummyRoute = new ActivatedRouteSnapshot();
    const dummyState = {} as RouterStateSnapshot;
    const result = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));
    expect(result).toBe(true);
  });

  it('should prevent activation and navigate to login when not authenticated', () => {
    authService.isAuthenticated.and.returnValue(false);
    const dummyRoute = new ActivatedRouteSnapshot();
    const dummyState = {} as RouterStateSnapshot;
    const result = TestBed.runInInjectionContext(() => authGuard(dummyRoute, dummyState));
    expect(result).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
