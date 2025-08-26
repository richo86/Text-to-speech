import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { User, LoginUser } from '../user/user.model';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenKey = 'authToken';
  private readonly apiUrl = 'http://localhost:8000';

  readonly token = signal<string | null>(sessionStorage.getItem(this.tokenKey));
  readonly isAuthenticated = this.token.asReadonly();

  async signup(user: User): Promise<boolean> {
    try {
      const response = await firstValueFrom(this.http.post<{ token: string }>(
        `${this.apiUrl}/signup`,
        user
      ));

      if (response?.token) {
        this.token.set(response.token);
        this.setToken(response.token);
        this.setUser(user.username);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Signup failed:', error);
      return false;
    }
  }

  async login(user: LoginUser): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ token: string }>(
          `${this.apiUrl}/login`,
          user
        )
      );

      if (response?.token) {
        this.token.set(response.token);
        this.setToken(response.token);
        this.setUser(user.username);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  logout(): void {
    this.token.set(null);
    sessionStorage.removeItem(this.tokenKey);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    sessionStorage.setItem(this.tokenKey, token);
  }

  removeToken(): void {
    sessionStorage.removeItem(this.tokenKey);
  }

  setUser(username: string): void {
    sessionStorage.setItem('username', username);
  }

  getUser(): string | null {
    return sessionStorage.getItem('username');
  }
}
