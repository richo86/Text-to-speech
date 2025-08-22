import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { Auth } from '../auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<Auth>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('Auth', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        LoginComponent
      ],
      providers: [
        { provide: Auth, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(Auth) as jasmine.SpyObj<Auth>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate required fields', () => {
    const form = component.loginForm;

    expect(form.valid).toBeFalse();

    form.controls.username.setValue('testuser');
    form.controls.password.setValue('password');

    expect(form.valid).toBeTrue();
  });

  it('should show loading state during submission', async () => {
    component.loginForm.setValue({ username: 'test', password: 'password' });

    component.onSubmit();
    expect(component.isLoading()).toBeTrue();

    // Complete the async operation
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(component.isLoading()).toBeFalse();
  });

  it('should navigate on successful login', async () => {
    const testUser: { username: string; password: string } = { username: 'test', password: 'password' };
    authService.login.and.returnValue(Promise.resolve(true));

    component.loginForm.setValue(testUser);
    await component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard/main']);
  });

  it('should show error on failed login', async () => {
    authService.login.and.returnValue(Promise.resolve(false));

    component.loginForm.setValue({ username: 'test', password: 'wrong' });
    await component.onSubmit();

    expect(component.errorMessage()).toBe('Invalid email or password');
  });

  it('should handle network errors', async () => {
    authService.login.and.throwError('Network error');

    component.loginForm.setValue({ username: 'test', password: 'password' });
    await component.onSubmit();

    expect(component.errorMessage()).toBe('Login failed. Please try again.');
  });
});
