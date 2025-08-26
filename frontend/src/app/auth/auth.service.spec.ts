import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Auth } from './auth.service';
import { User, LoginUser } from '../user/user.model';
import { Router } from '@angular/router';

describe('Auth Service', () => {
  let service: Auth;
  let httpClientMock: { post: jasmine.Spy };
  const testToken = 'test-jwt-token';
  const apiUrl = 'http://localhost:8000';
  const tokenKey = 'authToken';

  beforeEach(() => {
    sessionStorage.clear();
    httpClientMock = { post: jasmine.createSpy('post') };
    TestBed.configureTestingModule({
      providers: [
        Auth,
        { provide: HttpClient, useValue: httpClientMock },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    });
    service = TestBed.inject(Auth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('signup flow', () => {
    it('should store token on successful signup', async () => {
      const testUser: User = { username: 'test', email: 'test@test.com', password: 'Password123!' };

  httpClientMock.post.and.returnValue(of({ token: testToken }));
      const result = await service.signup(testUser);
      const refreshedService = TestBed.runInInjectionContext(() => TestBed.inject(Auth));
      expect(result).toBe(true);
      expect(refreshedService.token()).toBe(testToken);
      expect(sessionStorage.getItem(tokenKey)).toBe(testToken);
    });

    it('should handle signup errors', async () => {
      const testUser: User = { username: 'test', email: 'test@test.com', password: 'Password123!' };

  httpClientMock.post.and.returnValue(throwError(() => new Error('Network error')));
  const result = await service.signup(testUser);
  expect(result).toBe(false);
  expect(service.token()).toBeNull();
  expect(sessionStorage.getItem(tokenKey)).toBeNull();
    });

    it('should reject weak passwords', async () => {
      const weakPasswordUser: User = { username: 'test', email: 'test@test.com', password: 'weak' };

  httpClientMock.post.and.returnValue(of({ token: null }));
  const result = await service.signup(weakPasswordUser);
  expect(result).toBe(false);
  expect(service.token()).toBeNull();
    });
  });

  describe('login flow', () => {
    it('should store token on successful login', async () => {
      const testUser: LoginUser = { username: 'test', password: 'Password123!' };

  httpClientMock.post.and.returnValue(of({ token: testToken }));
      const result = await service.login(testUser);
      const refreshedService = TestBed.runInInjectionContext(() => TestBed.inject(Auth));
      expect(result).toBe(true);
      expect(refreshedService.token()).toBe(testToken);
      expect(sessionStorage.getItem(tokenKey)).toBe(testToken);
    });

        it('should reject invalid credentials', async () => {
          const testUser: LoginUser = { username: 'wrong', password: 'wrong' };

  httpClientMock.post.and.returnValue(of({ token: null }));
      const result = await service.login(testUser);
      expect(result).toBe(false);
      expect(service.token()).toBeNull();
    });
  });

  describe('logout flow', () => {
    it('should clear token and navigate to login', () => {
      service.logout();
      expect(service.token()).toBeNull();
      expect(sessionStorage.getItem(tokenKey)).toBeNull();
      expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('token persistence', () => {
    it('should load token from sessionStorage on init', () => {
      sessionStorage.setItem(tokenKey, testToken);
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          Auth,
          { provide: HttpClient, useValue: { post: jasmine.createSpy('post') } },
          { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
        ]
      });
      const newService = TestBed.inject(Auth);
      expect(newService.token()).toBe(testToken);
    });
  });
});
