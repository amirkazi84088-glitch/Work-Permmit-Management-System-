import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrganizationService } from '../../../core/services/organization.service';
import { Organization } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';

const organizationCodePattern = /^[A-Z0-9_-]{2,20}$/;
const organizationPhonePattern = /^[0-9+\-\s()]{7,20}$/;

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>Organizations</h2>
          <p>View and manage organizations across the platform.</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 380px 1fr; gap:24px; align-items:start;">
        <div class="card">
          <div class="card-header"><h3>{{ editingId() ? 'Edit Organization' : 'Create Organization' }}</h3></div>
          <div class="card-body">
            <form [formGroup]="form" (ngSubmit)="saveOrganization()">
              <div class="form-group">
                <label class="form-label">Name</label>
                <input class="form-control" formControlName="name" />
                @if (form.get('name')?.touched && form.get('name')?.hasError('required')) {
                  <div class="form-error">Organization name is required</div>
                }
                @if (form.get('name')?.touched && form.get('name')?.hasError('minlength')) {
                  <div class="form-error">Organization name must be at least 2 characters</div>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Code</label>
                <input class="form-control" formControlName="code" />
                @if (form.get('code')?.touched && form.get('code')?.hasError('required')) {
                  <div class="form-error">Organization code is required</div>
                }
                @if (form.get('code')?.touched && form.get('code')?.hasError('pattern')) {
                  <div class="form-error">Use 2-20 uppercase letters, numbers, underscore, or hyphen</div>
                }
              </div>
              <div class="form-grid cols-2">
                <div class="form-group"><label class="form-label">City</label><input class="form-control" formControlName="city" /></div>
                <div class="form-group"><label class="form-label">Country</label><input class="form-control" formControlName="country" /></div>
              </div>
              <div class="form-grid cols-2">
                <div class="form-group">
                  <label class="form-label">Email</label>
                  <input class="form-control" formControlName="email" />
                  @if (form.get('email')?.touched && form.get('email')?.hasError('email')) {
                    <div class="form-error">Enter a valid email address</div>
                  }
                </div>
                <div class="form-group">
                  <label class="form-label">Phone</label>
                  <input class="form-control" formControlName="phone" />
                  @if (form.get('phone')?.touched && form.get('phone')?.hasError('pattern')) {
                    <div class="form-error">Enter a valid phone number</div>
                  }
                </div>
              </div>
              <div class="form-grid cols-2">
                <div class="form-group">
                  <label class="form-label">Status</label>
                  <select class="form-control" formControlName="status">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="TRIAL">TRIAL</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Max Users</label>
                  <input class="form-control" type="number" formControlName="maxUsers" />
                  @if (form.get('maxUsers')?.touched && form.get('maxUsers')?.hasError('min')) {
                    <div class="form-error">Max users must be at least 1</div>
                  }
                </div>
              </div>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-primary" type="submit" [disabled]="loading() || form.invalid">Save</button>
                @if (editingId()) { <button class="btn btn-secondary" type="button" (click)="resetForm()">Cancel</button> }
              </div>
            </form>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>Registered Organizations</h3></div>
          <div class="card-body" style="padding:0;">
            @if (loading()) {
              <div class="empty-state"><p>Loading organizations...</p></div>
            } @else {
              <div class="table-wrapper" style="border:none;">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Code</th>
                      <th>Users</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (org of organizations(); track org.id) {
                      <tr>
                        <td>
                          <div style="font-weight:600;color:var(--text-primary);">{{ org.name }}</div>
                          <div style="font-size:0.75rem;color:var(--text-muted);">{{ org.city || 'No city' }}</div>
                        </td>
                        <td>{{ org.code }}</td>
                        <td>{{ org.currentUsers || 0 }} / {{ org.maxUsers || '∞' }}</td>
                        <td>{{ org.status }}</td>
                        <td>
                          <div style="display:flex; gap:4px;">
                            <button class="btn btn-ghost btn-sm" (click)="editOrganization(org)">Edit</button>
                            <button class="btn btn-ghost btn-sm" (click)="toggleStatus(org)">Toggle</button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class OrganizationsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private organizationService = inject(OrganizationService);
  private toastService = inject(ToastService);

  loading = signal(true);
  organizations = signal<Organization[]>([]);
  editingId = signal<number | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    code: ['', [Validators.required, Validators.pattern(organizationCodePattern)]],
    city: [''],
    country: [''],
    email: ['', Validators.email],
    phone: ['', Validators.pattern(organizationPhonePattern)],
    status: ['ACTIVE', Validators.required],
    maxUsers: [100, Validators.min(1)]
  });

  ngOnInit(): void {
    this.loadOrganizations();
  }

  loadOrganizations(): void {
    this.loading.set(true);
    this.organizationService.getOrganizations(0, 100, '').subscribe({
      next: response => {
        this.organizations.set(response.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  saveOrganization(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload = {
      ...raw,
      name: raw.name?.trim(),
      code: raw.code?.trim().toUpperCase(),
      city: raw.city?.trim() || '',
      country: raw.country?.trim() || '',
      email: raw.email?.trim() || '',
      phone: raw.phone?.trim() || ''
    } as Partial<Organization>;
    const request$ = this.editingId()
      ? this.organizationService.updateOrganization(this.editingId()!, payload)
      : this.organizationService.createOrganization(payload);

    request$.subscribe({
      next: () => {
        this.toastService.success('Organization saved', payload.name || 'Organization updated');
        this.resetForm();
        this.loadOrganizations();
      },
      error: err => this.toastService.error('Save failed', err?.error?.message || 'Please try again')
    });
  }

  editOrganization(org: Organization): void {
    this.editingId.set(org.id);
    this.form.patchValue({
      name: org.name,
      code: org.code,
      city: org.city || '',
      country: org.country || '',
      email: org.email || '',
      phone: org.phone || '',
      status: org.status,
      maxUsers: org.maxUsers || 100
    });
  }

  toggleStatus(org: Organization): void {
    this.organizationService.toggleOrganizationStatus(org.id).subscribe({
      next: () => {
        this.toastService.success('Status updated', org.name);
        this.loadOrganizations();
      },
      error: err => this.toastService.error('Toggle failed', err?.error?.message || 'Please try again')
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', code: '', city: '', country: '', email: '', phone: '', status: 'ACTIVE', maxUsers: 100 });
  }
}
