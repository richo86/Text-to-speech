import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenKey = 'authToken';
  private readonly apiUrl = 'http://localhost:3000/api/auth';

  readonly token = signal<string | null>(localStorage.getItem(this.tokenKey));
  readonly isAuthenticated = this.token.asReadonly();

  async signup(username: string, email: string, password: string): Promise<boolean> {
    try {
      const response = await this.http.post<{ token: string }>(
        `${this.apiUrl}/signup`,
        { username, email, password }
      ).toPromise();
      
      if (response?.token) {
        this.token.set(response.token);
        localStorage.setItem(this.tokenKey, response.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Signup failed:', error);
      return false;
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await this.http.post<{ token: string }>(
        `${this.apiUrl}/login`,
        { email, password }
      ).toPromise();
      
      if (response?.token) {
        this.token.set(response.token);
        localStorage.setItem(this.tokenKey, response.token);
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
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/login']);
  }
}
