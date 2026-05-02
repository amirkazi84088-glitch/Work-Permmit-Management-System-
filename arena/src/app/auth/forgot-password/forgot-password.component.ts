import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-box">
        <div class="auth-icon">🔑</div>
        <h2>Forgot Password</h2>
        <p>Enter your email address and we'll send you a link to reset your password.</p>

        @if (sent()) {
          <div class="alert alert-success">
            <span class="alert-icon">✅</span>
            <div>
              <strong>Email sent!</strong>
              <p>Check your inbox for the password reset link. It expires in 30 minutes.</p>
            </div>
          </div>
          <a routerLink="/auth/login" class="btn btn-primary w-full" style="margin-top:20px;">Back to Login</a>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-group" style="margin-top: 24px;">
              <label class="form-label">Email Address</label>
              <input
                type="email"
                formControlName="email"
                class="form-control"
                [class.is-invalid]="form.get('email')?.invalid && form.get('email')?.touched"
                placeholder="you@example.com"
              />
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <span class="form-error">⚠ Please enter a valid email address</span>
              }
            </div>
            @if (error()) {
              <div class="alert alert-danger" style="margin-bottom: 16px;">
                <span class="alert-icon">⚠️</span> {{ error() }}
              </div>
            }
            <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
              @if (loading()) { <span class="btn-spinner"></span> Sending... }
              @else { Send Reset Link }
            </button>
          </form>
          <div style="text-align:center;margin-top:20px;">
            <a routerLink="/auth/login" style="font-size:0.875rem;color:#64748b;">← Back to Login</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary, #f8fafc);
      padding: 24px;
    }
    .auth-box {
      background: white;
      border-radius: 16px;
      padding: 40px;
      width: 100%;
      max-width: 420px;
      border: 1px solid var(--border, #e2e8f0);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      text-align: center;
    }
    .auth-icon { font-size: 48px; margin-bottom: 16px; }
    h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; }
    p { color: #64748b; font-size: 0.9rem; margin-bottom: 8px; }
  `]
})
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = signal(false);
  sent = signal(false);
  error = signal('');

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    this.authService.forgotPassword({ email: this.form.value.email }).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      error: (err) => { this.loading.set(false); this.error.set(err?.error?.message || 'Failed to send reset email.'); }
    });
  }
}
