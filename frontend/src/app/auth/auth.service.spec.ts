import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Auth } from './auth.service';
import { User, LoginUser } from '../user/user.model';
import { Router } from '@angular/router';

describe('Auth Service', () => {
  let service: Auth;
  let httpMock: HttpTestingController;
  const testToken = 'test-jwt-token';
  const apiUrl = 'http://localhost:8000';
  const tokenKey = 'authToken';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        Auth,
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    });
    service = TestBed.inject(Auth);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('signup flow', () => {
    it('should store token on successful signup', async () => {
      const testUser: User = { username: 'test', email: 'test@test.com', password: 'Password123!' };
      
      const result = service.signup(testUser);
      const req = httpMock.expectOne(`${apiUrl}/signup`);
      
      req.flush({ token: testToken });
      expect(await result).toBe(true);
      expect(service.token()).toBe(testToken);
      expect(localStorage.getItem(tokenKey)).toBe(testToken);
    });

    it('should handle signup errors', async () => {
      const testUser: User = { username: 'test', email: 'test@test.com', password: 'Password123!' };
      
      const result = service.signup(testUser);
      const req = httpMock.expectOne(`${apiUrl}/signup`);
      
      req.error(new ErrorEvent('Network error'));
      expect(await result).toBe(false);
      expect(service.token()).toBeNull();
      expect(localStorage.getItem(tokenKey)).toBeNull();
    });

    it('should reject weak passwords', async () => {
      const weakPasswordUser: User = { username: 'test', email: 'test@test.com', password: 'weak' };
      
      const result = service.signup(weakPasswordUser);
      const req = httpMock.expectOne(`${apiUrl}/signup`);
      
      req.flush('Password too weak', { status: 400, statusText: 'Bad Request' });
      expect(await result).toBe(false);
      expect(service.token()).toBeNull();
    });
  });

  describe('login flow', () => {
    it('should store token on successful login', async () => {
      const testUser: LoginUser = { username: 'test', password: 'Password123!' };
      
      const result = service.login(testUser);
      const req = httpMock.expectOne(`${apiUrl}/login`);
      
      req.flush({ token: testToken });
      expect(await result).toBe(true);
      expect(service.token()).toBe(testToken);
      expect(localStorage.getItem(tokenKey)).toBe(testToken);
    });

    it('should reject invalid credentials', async () => {
      const testUser: LoginUser = { username: 'wrong', password: 'wrong' };
      
      const result = service.login(testUser);
      const req = httpMock.expectOne(`${apiUrl}/login`);
      
      req.flush('Invalid credentials', { status: 401, statusText: 'Unauthorized' });
      expect(await result).toBe(false);
      expect(service.token()).toBeNull();
    });
  });

  describe('logout flow', () => {
    it('should clear token and navigate to login', () => {
      service.logout();
      expect(service.token()).toBeNull();
      expect(localStorage.getItem(tokenKey)).toBeNull();
      expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('token persistence', () => {
    it('should load token from localStorage on init', () => {
      localStorage.setItem(tokenKey, testToken);
      const newService = new Auth();
      expect(newService.token()).toBe(testToken);
    });
  });
});