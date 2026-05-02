import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrganizationService } from '../../../core/services/organization.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { Department, User } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';

const departmentNamePattern = /^[A-Za-z0-9][A-Za-z0-9\s&()\-_/]*$/;

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>Departments</h2>
          <p>Configure department structure and assign managers inside your organization.</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 360px 1fr; gap:24px; align-items:start;">
        <div class="card">
          <div class="card-header"><h3>{{ editingId() ? 'Edit Department' : 'Add Department' }}</h3></div>
          <div class="card-body">
            <form [formGroup]="form" (ngSubmit)="saveDepartment()">
              <div class="form-group">
                <label class="form-label">Department Name</label>
                <input class="form-control" formControlName="name" />
                @if (form.get('name')?.touched && form.get('name')?.hasError('required')) {
                  <div class="form-error">Department name is required</div>
                }
                @if (form.get('name')?.touched && form.get('name')?.hasError('minlength')) {
                  <div class="form-error">Department name must be at least 2 characters</div>
                }
                @if (form.get('name')?.touched && form.get('name')?.hasError('pattern')) {
                  <div class="form-error">Department name contains invalid characters</div>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Manager</label>
                <select class="form-control" formControlName="managerId">
                  <option value="">No manager</option>
                  @for (user of managers(); track user.id) {
                    <option [value]="user.id">{{ user.firstName }} {{ user.lastName }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-control" formControlName="isActive">
                  <option [ngValue]="true">Active</option>
                  <option [ngValue]="false">Inactive</option>
                </select>
              </div>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-primary" type="submit" [disabled]="loading() || form.invalid">Save</button>
                @if (editingId()) {
                  <button class="btn btn-secondary" type="button" (click)="resetForm()">Cancel</button>
                }
              </div>
            </form>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>{{ orgName() }}</h3></div>
          <div class="card-body" style="padding:0;">
            @if (loading()) {
              <div class="empty-state"><p>Loading departments...</p></div>
            } @else if (departments().length === 0) {
              <div class="empty-state"><p>No departments configured yet.</p></div>
            } @else {
              <div class="table-wrapper" style="border:none;">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Manager</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (department of departments(); track department.id) {
                      <tr>
                        <td>{{ department.name }}</td>
                        <td>{{ department.managerName || 'Unassigned' }}</td>
                        <td>{{ department.isActive ? 'Active' : 'Inactive' }}</td>
                        <td>
                          <div style="display:flex; gap:4px;">
                            <button class="btn btn-ghost btn-sm" (click)="editDepartment(department)">Edit</button>
                            <button class="btn btn-ghost btn-sm" style="color:var(--danger);" (click)="removeDepartment(department)">Delete</button>
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
export class DepartmentsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private organizationService = inject(OrganizationService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  loading = signal(true);
  departments = signal<Department[]>([]);
  managers = signal<User[]>([]);
  orgName = signal('Departments');
  editingId = signal<number | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.pattern(departmentNamePattern)]],
    managerId: [''],
    isActive: [true, Validators.required]
  });

  ngOnInit(): void {
    const user = this.authService.user();
    this.orgName.set(user?.organizationName || 'Organization Departments');
    this.loadManagers();
    this.loadDepartments();
  }

  loadDepartments(): void {
    const orgId = this.authService.user()?.organizationId;
    if (!orgId) {
      this.loading.set(false);
      return;
    }

    this.organizationService.getDepartments(orgId).subscribe({
      next: departments => {
        this.departments.set(departments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadManagers(): void {
    this.userService.getUsers({ page: 0, size: 200 }).subscribe({
      next: response => this.managers.set(response.content.filter(user => ['SUPERVISOR', 'ADMIN'].includes(user.role)))
    });
  }

  saveDepartment(): void {
    const orgId = this.authService.user()?.organizationId;
    if (!orgId) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name?.trim() ?? '',
      managerId: raw.managerId ? Number(raw.managerId) : undefined,
      isActive: !!raw.isActive
    };

    const request$ = this.editingId()
      ? this.organizationService.updateDepartment(orgId, this.editingId()!, payload)
      : this.organizationService.createDepartment(orgId, payload);

    request$.subscribe({
      next: () => {
        this.toastService.success('Department saved', `${payload.name} has been updated`);
        this.resetForm();
        this.loadDepartments();
      },
      error: err => this.toastService.error('Save failed', err?.error?.message || 'Please try again')
    });
  }

  editDepartment(department: Department): void {
    this.editingId.set(department.id);
    this.form.patchValue({
      name: department.name,
      managerId: department.managerId ? String(department.managerId) : '',
      isActive: department.isActive
    });
  }

  removeDepartment(department: Department): void {
    const orgId = this.authService.user()?.organizationId;
    if (!orgId || !confirm(`Delete department ${department.name}?`)) {
      return;
    }

    this.organizationService.deleteDepartment(orgId, department.id).subscribe({
      next: () => {
        this.toastService.success('Department deleted', department.name);
        this.loadDepartments();
      },
      error: err => this.toastService.error('Delete failed', err?.error?.message || 'Please try again')
    });
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', managerId: '', isActive: true });
  }
}
