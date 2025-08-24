import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { Auth } from '../auth.service';
import { Signup } from './signup.component';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

describe('Signup', () => {
  let component: Signup;
  let authService: jasmine.SpyObj<Auth>;
  let router: jasmine.SpyObj<Router>;

  const TEST_EMAIL = 'new@example.com';
  const TEST_PASSWORD = 'Password123!';
  const TEST_USERNAME = 'newuser';

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('Auth', ['signup']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      imports: [Signup, ReactiveFormsModule, MatCardModule, MatInputModule, MatButtonModule],
      providers: [
        { provide: Auth, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: {} },
        { provide: HttpClient, useValue: { post: jasmine.createSpy('post') } }
      ]
    });
    const fixture = TestBed.createComponent(Signup);
    component = fixture.componentInstance;
    authService = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate required fields', () => {
    const form = component['signupForm'];
    expect(form.valid).toBeFalse();
    form.controls.username.setValue(TEST_USERNAME);
    form.controls.email.setValue(TEST_EMAIL);
    form.controls.password.setValue(TEST_PASSWORD);
    expect(form.valid).toBeTrue();
  });

  it('should show error for empty fields', () => {
    const form = component['signupForm'];
    form.controls.username.setValue('');
    form.controls.email.setValue('');
    form.controls.password.setValue('');
    expect(form.controls.username.hasError('required')).toBeTrue();
    expect(form.controls.email.hasError('required')).toBeTrue();
    expect(form.controls.password.hasError('required')).toBeTrue();
  });

  it('should validate email format', () => {
    const form = component['signupForm'];
    form.controls.email.setValue('invalid-email');
    expect(form.controls.email.hasError('email')).toBeTrue();
    form.controls.email.setValue(TEST_EMAIL);
    expect(form.controls.email.hasError('email')).toBeFalse();
  });

  it('should validate password minLength', () => {
    const form = component['signupForm'];
    form.controls.password.setValue('123');
    expect(form.controls.password.hasError('minlength')).toBeTrue();
    form.controls.password.setValue(TEST_PASSWORD);
    expect(form.controls.password.hasError('minlength')).toBeFalse();
  });

  it('should show error on signup failure', async () => {
    authService.signup.and.returnValue(Promise.resolve(false));
    component['signupForm'].setValue({
      username: TEST_USERNAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    await component.onSubmit();
    expect(component['errorMessage']()).toBe('Signup failed. Please try again.');
  });

  it('should navigate on successful registration', async () => {
    authService.signup.and.returnValue(Promise.resolve(true));
    component['signupForm'].setValue({
      username: TEST_USERNAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    await component.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/main']);
  });

  it('should handle network errors', async () => {
    authService.signup.and.callFake(() => {
      throw new Error('Network error');
    });
    component['signupForm'].setValue({
      username: TEST_USERNAME,
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    await component.onSubmit();
    expect(component['errorMessage']()).toBe('An unexpected error occurred. Please try again.');
  });
});
