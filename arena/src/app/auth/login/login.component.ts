import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="login-left">
        <div class="brand">
          <div class="brand-icon">🏗️</div>
          <h1>WPMS</h1>
          <p>Work Permit Management System</p>
        </div>
        <div class="features">
          <div class="feature-item">
            <span class="feature-icon">🛡️</span>
            <div>
              <strong>Role-Based Access</strong>
              <p>Worker, Supervisor, Safety Officer, Admin, Super Admin</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📋</span>
            <div>
              <strong>Permit Workflow</strong>
              <p>Streamlined approval process with audit trail</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🔔</span>
            <div>
              <strong>Email Notifications</strong>
              <p>Real-time alerts for every permit status change</p>
            </div>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🏢</span>
            <div>
              <strong>Multi-Organization</strong>
              <p>Manage permits across multiple organizations</p>
            </div>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-box">
          <div class="login-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          @if (errorMessage()) {
            <div class="alert alert-danger" style="margin-bottom: 20px;">
              <span class="alert-icon">⚠️</span>
              {{ errorMessage() }}
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input
                type="email"
                formControlName="email"
                class="form-control"
                [class.is-invalid]="isInvalid('email')"
                placeholder="you@example.com"
                autocomplete="email"
              />
              @if (isInvalid('email')) {
                <span class="form-error">⚠ Please enter a valid email address</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="password-wrapper">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  class="form-control"
                  [class.is-invalid]="isInvalid('password')"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="password-toggle"
                  (click)="showPassword.set(!showPassword())"
                  title="Toggle password visibility"
                >
                  {{ showPassword() ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (isInvalid('password')) {
                <span class="form-error">⚠ Password is required</span>
              }
            </div>

            <div class="login-meta">
              <label class="remember-me">
                <input type="checkbox" formControlName="rememberMe" />
                <span>Remember me</span>
              </label>
              <a routerLink="/auth/forgot-password" class="forgot-link">Forgot password?</a>
            </div>

            <button
              type="submit"
              class="btn btn-primary w-full btn-login"
              [disabled]="loading()"
            >
              @if (loading()) {
                <span class="btn-spinner"></span>
                Signing in...
              } @else {
                Sign In
              }
            </button>
          </form>

          <div class="login-footer">
            <p>Having trouble? Contact your system administrator.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
    }

    .login-left {
      flex: 1;
      background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 60px;
      color: white;

      @media (max-width: 900px) { display: none; }
    }

    .brand {
      margin-bottom: 60px;
      .brand-icon { font-size: 48px; margin-bottom: 16px; }
      h1 { font-size: 2.5rem; font-weight: 800; color: white; margin-bottom: 8px; letter-spacing: -0.5px; }
      p { color: #94a3b8; font-size: 1.1rem; }
    }

    .features { display: flex; flex-direction: column; gap: 28px; }

    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      .feature-icon { font-size: 24px; flex-shrink: 0; margin-top: 2px; }
      strong { display: block; color: white; font-size: 0.95rem; margin-bottom: 4px; }
      p { color: #64748b; font-size: 0.85rem; margin: 0; }
    }

    .login-right {
      width: 480px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary, #f8fafc);
      padding: 40px;

      @media (max-width: 900px) {
        width: 100%;
        padding: 24px;
      }
    }

    .login-box {
      width: 100%;
      max-width: 400px;
    }

    .login-header {
      margin-bottom: 32px;
      h2 { font-size: 1.75rem; font-weight: 700; margin-bottom: 8px; }
      p { color: #64748b; }
    }

    .btn-login {
      width: 100%;
      height: 48px;
      font-size: 1rem;
      margin-top: 4px;
    }

    .login-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .remember-me {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      color: #475569;
      input { cursor: pointer; }
    }

    .forgot-link {
      font-size: 0.875rem;
      color: #2563eb;
      font-weight: 500;
      &:hover { text-decoration: underline; }
    }

    .password-wrapper {
      position: relative;
      .form-control { padding-right: 44px; }
    }

    .password-toggle {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      padding: 4px;
    }

    .login-footer {
      margin-top: 28px;
      text-align: center;
      p { font-size: 0.8rem; color: #94a3b8; }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.loginForm.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (data) => {
        this.loading.set(false);
        this.toastService.success('Welcome back!', `Signed in as ${data.user.firstName}`);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl || this.authService.getDashboardRoute());
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message || 'Invalid email or password. Please try again.';
        this.errorMessage.set(msg);
      }
    });
  }
}
