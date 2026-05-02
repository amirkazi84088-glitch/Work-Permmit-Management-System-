import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models';

const namePattern = /^[A-Za-z][A-Za-z\s'-]*$/;
const phonePattern = /^[0-9+\-\s()]{7,20}$/;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>My Profile</h2>
          <p>Manage your account settings and preferences</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <!-- Profile Info -->
        <div class="card">
          <div class="card-header"><h3>👤 Personal Information</h3></div>
          <div class="card-body">
            <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
              <div class="form-grid cols-2">
                <div class="form-group">
                  <label class="form-label">First Name</label>
                  <input type="text" formControlName="firstName" class="form-control" />
                  @if (profileForm.get('firstName')?.touched && profileForm.get('firstName')?.hasError('required')) {
                    <div class="form-error">First name is required</div>
                  }
                  @if (profileForm.get('firstName')?.touched && profileForm.get('firstName')?.hasError('pattern')) {
                    <div class="form-error">First name contains invalid characters</div>
                  }
                </div>
                <div class="form-group">
                  <label class="form-label">Last Name</label>
                  <input type="text" formControlName="lastName" class="form-control" />
                  @if (profileForm.get('lastName')?.touched && profileForm.get('lastName')?.hasError('required')) {
                    <div class="form-error">Last name is required</div>
                  }
                  @if (profileForm.get('lastName')?.touched && profileForm.get('lastName')?.hasError('pattern')) {
                    <div class="form-error">Last name contains invalid characters</div>
                  }
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" formControlName="email" class="form-control" />
                @if (profileForm.get('email')?.touched && profileForm.get('email')?.hasError('required')) {
                  <div class="form-error">Email is required</div>
                }
                @if (profileForm.get('email')?.touched && profileForm.get('email')?.hasError('email')) {
                  <div class="form-error">Enter a valid email address</div>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Phone</label>
                <input type="tel" formControlName="phone" class="form-control" placeholder="+1 (555) 000-0000" />
                @if (profileForm.get('phone')?.touched && profileForm.get('phone')?.hasError('pattern')) {
                  <div class="form-error">Enter a valid phone number</div>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Employee ID</label>
                <input type="text" formControlName="employeeId" class="form-control" [attr.disabled]="true" />
              </div>
              <button type="submit" class="btn btn-primary" [disabled]="profileLoading()">
                @if (profileLoading()) { <span class="btn-spinner"></span> Saving... }
                @else { 💾 Save Changes }
              </button>
            </form>
          </div>
        </div>

        <!-- Password -->
        <div class="card">
          <div class="card-header"><h3>🔐 Change Password</h3></div>
          <div class="card-body">
            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
              <div class="form-group">
                <label class="form-label">Current Password</label>
                <input type="password" formControlName="currentPassword" class="form-control" />
                @if (passwordForm.get('currentPassword')?.touched && passwordForm.get('currentPassword')?.hasError('required')) {
                  <div class="form-error">Current password is required</div>
                }
              </div>
              <div class="form-group">
                <label class="form-label">New Password</label>
                <input type="password" formControlName="newPassword" class="form-control" />
                @if (passwordForm.get('newPassword')?.touched && passwordForm.get('newPassword')?.hasError('required')) {
                  <div class="form-error">New password is required</div>
                }
                @if (passwordForm.get('newPassword')?.touched && passwordForm.get('newPassword')?.hasError('minlength')) {
                  <div class="form-error">Password must be at least 8 characters</div>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Confirm New Password</label>
                <input type="password" formControlName="confirmPassword" class="form-control" />
                @if (passwordForm.get('confirmPassword')?.touched && passwordForm.get('confirmPassword')?.hasError('required')) {
                  <div class="form-error">Please confirm the new password</div>
                }
              </div>
              @if (passwordForm.errors?.['mismatch'] && passwordForm.get('confirmPassword')?.touched) {
                <div class="form-error">⚠ Passwords do not match</div>
              }
              <button type="submit" class="btn btn-primary" [disabled]="passwordLoading()">
                @if (passwordLoading()) { <span class="btn-spinner"></span> Updating... }
                @else { 🔒 Update Password }
              </button>
            </form>
          </div>
        </div>
      </div>

      <!-- Account Info (read-only) -->
      <div class="card" style="margin-top: 24px;">
        <div class="card-header"><h3>ℹ️ Account Information</h3></div>
        <div class="card-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Role</span>
              <span>{{ getRoleLabel() }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Organization</span>
              <span>{{ user()?.organizationName || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Department</span>
              <span>{{ user()?.departmentName || '—' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Account Created</span>
              <span>{{ user()?.createdAt | date:'dd MMM yyyy' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Last Login</span>
              <span>{{ user()?.lastLogin ? (user()!.lastLogin | date:'dd MMM yyyy, HH:mm') : 'N/A' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Account Status</span>
              <span class="badge" [class]="isUserActive() ? 'badge-approved' : 'badge-rejected'">
                {{ isUserActive() ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .detail-item { display: flex; flex-direction: column; gap: 6px; }
    .detail-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
  `]
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  user = this.authService.user;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  profileLoading = signal(false);
  passwordLoading = signal(false);

  ngOnInit(): void {
    const u = this.user();
    this.profileForm = this.fb.group({
      firstName: [u?.firstName || '', [Validators.required, Validators.pattern(namePattern)]],
      lastName: [u?.lastName || '', [Validators.required, Validators.pattern(namePattern)]],
      email: [u?.email || '', [Validators.required, Validators.email]],
      phone: [u?.phone || '', [Validators.pattern(phonePattern)]],
      employeeId: [{ value: u?.employeeId || '', disabled: true }]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(group: FormGroup) {
    const pw = group.get('newPassword')?.value;
    const cp = group.get('confirmPassword')?.value;
    return pw === cp ? null : { mismatch: true };
  }

  updateProfile(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.profileLoading.set(true);
    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.profileLoading.set(false);
        this.toastService.success('Profile updated', 'Your information has been saved');
      },
      error: (err) => {
        this.profileLoading.set(false);
        this.toastService.error('Update failed', err?.error?.message || 'Please try again');
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    this.passwordLoading.set(true);
    this.authService.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.passwordLoading.set(false);
        this.passwordForm.reset();
        this.toastService.success('Password changed', 'Your password has been updated');
      },
      error: (err) => {
        this.passwordLoading.set(false);
        this.toastService.error('Password change failed', err?.error?.message || 'Please try again');
      }
    });
  }

  getRoleLabel(): string {
    const map: Record<string, string> = {
      WORKER: 'Worker', SUPERVISOR: 'Supervisor', PERMIT_APPROVER: 'Permit Approver',
      SAFETY_OFFICER: 'Safety Officer', ADMIN: 'Admin', SUPER_ADMIN: 'Super Admin'
    };
    return map[this.user()?.role ?? ''] ?? '';
  }

  isUserActive(): boolean {
    return !!this.user()?.isActive;
  }
}
