import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    RouterLink
  ],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(Auth);
  private readonly router = inject(Router);

  protected readonly signupForm = this.fb.nonNullable.group({
    username: this.fb.nonNullable.control('', Validators.required),
    email: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(6)])
  });

  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  async onSubmit(): Promise<void> {
    if (this.signupForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const success = await this.authService.signup(
        this.signupForm.value.username!,
        this.signupForm.value.email!,
        this.signupForm.value.password!
      );

      if (success) {
        await this.router.navigate(['/login']);
      } else {
        this.errorMessage.set('Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      this.errorMessage.set('An unexpected error occurred. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
