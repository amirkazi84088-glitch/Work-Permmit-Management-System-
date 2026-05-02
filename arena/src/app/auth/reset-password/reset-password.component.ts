import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-box">
        <div class="auth-icon">🔐</div>
        <h2>Reset Password</h2>
        <p>Enter your new password below.</p>

        @if (!token()) {
          <div class="alert alert-danger" style="margin-top:20px;">
            <span class="alert-icon">⚠️</span> Invalid or missing reset token. Please request a new reset link.
          </div>
          <a routerLink="/auth/forgot-password" class="btn btn-primary w-full" style="margin-top:16px;">Request New Link</a>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()" style="margin-top:24px;text-align:left;">
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input type="password" formControlName="newPassword" class="form-control"
                [class.is-invalid]="isInvalid('newPassword')" placeholder="Min. 8 characters" />
              @if (isInvalid('newPassword')) {
                <span class="form-error">⚠ Password must be at least 8 characters</span>
              }
            </div>
            <div class="form-group">
              <label class="form-label">Confirm New Password</label>
              <input type="password" formControlName="confirmPassword" class="form-control"
                [class.is-invalid]="isInvalid('confirmPassword') || form.errors?.['mismatch']" placeholder="Re-enter password" />
              @if (form.errors?.['mismatch'] && form.get('confirmPassword')?.touched) {
                <span class="form-error">⚠ Passwords do not match</span>
              }
            </div>
            @if (error()) {
              <div class="alert alert-danger" style="margin-bottom:16px;">
                <span class="alert-icon">⚠️</span> {{ error() }}
              </div>
            }
            <button type="submit" class="btn btn-primary w-full" [disabled]="loading()">
              @if (loading()) { <span class="btn-spinner"></span> Resetting... }
              @else { Reset Password }
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg-secondary,#f8fafc); padding:24px; }
    .auth-box { background:white; border-radius:16px; padding:40px; width:100%; max-width:420px; border:1px solid var(--border,#e2e8f0); box-shadow:0 4px 6px -1px rgb(0 0 0/0.1); text-align:center; }
    .auth-icon { font-size:48px; margin-bottom:16px; }
    h2 { font-size:1.5rem; font-weight:700; margin-bottom:8px; }
    p { color:#64748b; font-size:0.9rem; }
  `]
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  loading = signal(false);
  error = signal('');
  token = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token') || '';
    this.token.set(t);
  }

  isInvalid(f: string): boolean {
    const c = this.form.get(f);
    return !!(c?.invalid && c?.touched);
  }

  passwordMatchValidator(group: FormGroup) {
    const pw = group.get('newPassword')?.value;
    const cp = group.get('confirmPassword')?.value;
    return pw === cp ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const { newPassword, confirmPassword } = this.form.value;
    this.authService.resetPassword({ token: this.token(), newPassword, confirmPassword }).subscribe({
      next: () => {
        this.loading.set(false);
        this.toastService.success('Password reset successfully', 'You can now log in with your new password.');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => { this.loading.set(false); this.error.set(err?.error?.message || 'Failed to reset password.'); }
    });
  }
}
