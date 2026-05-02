import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole, Department } from '../../../core/models';

const personNamePattern = /^[A-Za-z][A-Za-z\s'-]*$/;
const phonePattern = /^[0-9+\-\s()]{7,20}$/;
const employeeIdPattern = /^[A-Za-z0-9._/-]{3,30}$/;

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>User Management</h2>
          <p>Sort users by role, update account details, and manage access for your organization.</p>
        </div>
      </div>

      <div style="display:grid; grid-template-columns: 380px 1fr; gap:24px; align-items:start;">
        <div class="card">
          <div class="card-header"><h3>Create User</h3></div>
          <div class="card-body">
            <form [formGroup]="form" (ngSubmit)="createUser()">
              <div class="form-group">
                <label class="form-label">First Name</label>
                <input class="form-control" formControlName="firstName" />
                @if (form.get('firstName')?.touched && form.get('firstName')?.hasError('required')) {
                  <div class="form-error">First name is required</div>
                }
                @if (form.get('firstName')?.touched && form.get('firstName')?.hasError('pattern')) {
                  <div class="form-error">First name contains invalid characters</div>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Last Name</label>
                <input class="form-control" formControlName="lastName" />
                @if (form.get('lastName')?.touched && form.get('lastName')?.hasError('required')) {
                  <div class="form-error">Last name is required</div>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input class="form-control" type="email" formControlName="email" />
                @if (form.get('email')?.touched && form.get('email')?.hasError('required')) {
                  <div class="form-error">Email is required</div>
                }
                @if (form.get('email')?.touched && form.get('email')?.hasError('email')) {
                  <div class="form-error">Enter a valid email address</div>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Password</label>
                <input class="form-control" type="password" formControlName="password" />
                @if (form.get('password')?.touched && form.get('password')?.hasError('required')) {
                  <div class="form-error">Password is required</div>
                }
                @if (form.get('password')?.touched && form.get('password')?.hasError('minlength')) {
                  <div class="form-error">Password must be at least 8 characters</div>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Phone</label>
                <input class="form-control" formControlName="phone" />
                @if (form.get('phone')?.touched && form.get('phone')?.hasError('pattern')) {
                  <div class="form-error">Enter a valid phone number</div>
                }
              </div>
              <div class="form-group">
                <label class="form-label">Role</label>
                <select class="form-control" formControlName="role">
                  @for (role of roles; track role) {
                    <option [value]="role">{{ role }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Department</label>
                <select class="form-control" formControlName="departmentId">
                  <option value="">No department</option>
                  @for (department of departments(); track department.id) {
                    <option [value]="department.id">{{ department.name }}</option>
                  }
                </select>
              </div>
              <button class="btn btn-primary" type="submit" [disabled]="loading() || form.invalid">Create User</button>
            </form>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>Users</h3></div>
          <div class="card-body" style="padding-bottom: 0;">
            <div class="filter-bar" style="margin-bottom: 0;">
              <div class="search-wrapper">
                <span class="search-icon">⌕</span>
                <input class="form-control" [(ngModel)]="searchTerm" (input)="applyFilters()" placeholder="Search by name or email" />
              </div>
              <select class="form-control filter-select" [(ngModel)]="roleFilter" (change)="applyFilters()">
                <option value="">All roles</option>
                @for (role of roles; track role) {
                  <option [value]="role">{{ role }}</option>
                }
              </select>
            </div>
          </div>
          <div class="card-body" style="padding:0;">
            @if (loading()) {
              <div class="empty-state"><p>Loading users...</p></div>
            } @else if (filteredUsers().length === 0) {
              <div class="empty-state"><p>No users found.</p></div>
            } @else {
              <div class="table-wrapper" style="border:none;">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (user of filteredUsers(); track user.id) {
                      <tr>
                        <td>{{ user.firstName }} {{ user.lastName }}</td>
                        <td>{{ user.email }}</td>
                        <td>{{ user.role }}</td>
                        <td>{{ user.departmentName || 'Unassigned' }}</td>
                        <td>{{ user.isActive ? 'Active' : 'Inactive' }}</td>
                        <td>
                          <div style="display:flex; gap:4px; flex-wrap:wrap;">
                            <button class="btn btn-ghost btn-sm" (click)="editUser(user)">Edit</button>
                            <button class="btn btn-ghost btn-sm" (click)="toggleStatus(user)">
                              {{ user.isActive ? 'Disable' : 'Enable' }}
                            </button>
                            <button class="btn btn-ghost btn-sm" (click)="resetPassword(user)">Reset</button>
                            <button class="btn btn-ghost btn-sm" style="color:var(--danger);" (click)="deleteUser(user)">Delete</button>
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

      @if (selectedUser()) {
        <div class="modal-backdrop">
          <div class="modal modal-md">
            <div class="modal-header">
              <h3>Edit User</h3>
              <button class="btn btn-ghost btn-sm" (click)="selectedUser.set(null)">x</button>
            </div>
            <div class="modal-body">
              <form [formGroup]="editForm">
                <div class="form-grid cols-2">
                  <div class="form-group">
                    <label class="form-label">First Name</label>
                    <input class="form-control" formControlName="firstName" />
                    @if (editForm.get('firstName')?.touched && editForm.get('firstName')?.hasError('required')) {
                      <div class="form-error">First name is required</div>
                    }
                  </div>
                  <div class="form-group">
                    <label class="form-label">Last Name</label>
                    <input class="form-control" formControlName="lastName" />
                    @if (editForm.get('lastName')?.touched && editForm.get('lastName')?.hasError('required')) {
                      <div class="form-error">Last name is required</div>
                    }
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Email</label>
                  <input class="form-control" type="email" formControlName="email" />
                  @if (editForm.get('email')?.touched && editForm.get('email')?.hasError('required')) {
                    <div class="form-error">Email is required</div>
                  }
                  @if (editForm.get('email')?.touched && editForm.get('email')?.hasError('email')) {
                    <div class="form-error">Enter a valid email address</div>
                  }
                </div>
                <div class="form-grid cols-2">
                  <div class="form-group">
                    <label class="form-label">Phone</label>
                    <input class="form-control" formControlName="phone" />
                    @if (editForm.get('phone')?.touched && editForm.get('phone')?.hasError('pattern')) {
                      <div class="form-error">Enter a valid phone number</div>
                    }
                  </div>
                  <div class="form-group">
                    <label class="form-label">Employee ID</label>
                    <input class="form-control" formControlName="employeeId" />
                    @if (editForm.get('employeeId')?.touched && editForm.get('employeeId')?.hasError('pattern')) {
                      <div class="form-error">Employee ID contains invalid characters</div>
                    }
                  </div>
                </div>
                <div class="form-grid cols-2">
                  <div class="form-group">
                    <label class="form-label">Role</label>
                    <select class="form-control" formControlName="role">
                      @for (role of roles; track role) {
                        <option [value]="role">{{ role }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Department</label>
                    <select class="form-control" formControlName="departmentId">
                      <option value="">No department</option>
                      @for (department of departments(); track department.id) {
                        <option [value]="department.id">{{ department.name }}</option>
                      }
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="selectedUser.set(null)">Cancel</button>
              <button class="btn btn-primary" (click)="saveEdit()" [disabled]="editForm.invalid">Save</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  private organizationService = inject(OrganizationService);
  private authService = inject(AuthService);

  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  departments = signal<Department[]>([]);
  loading = signal(true);
  selectedUser = signal<User | null>(null);
  roles: UserRole[] = ['WORKER', 'SUPERVISOR', 'SAFETY_OFFICER', 'PERMIT_APPROVER', 'ADMIN'];
  searchTerm = '';
  roleFilter = '';

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.pattern(personNamePattern)]],
    lastName: ['', [Validators.required, Validators.pattern(personNamePattern)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['Test@1234', [Validators.required, Validators.minLength(8)]],
    phone: ['', Validators.pattern(phonePattern)],
    employeeId: ['', Validators.pattern(employeeIdPattern)],
    role: ['WORKER' as UserRole, Validators.required],
    departmentId: ['']
  });

  editForm = this.fb.group({
    firstName: ['', [Validators.required, Validators.pattern(personNamePattern)]],
    lastName: ['', [Validators.required, Validators.pattern(personNamePattern)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.pattern(phonePattern)],
    employeeId: ['', Validators.pattern(employeeIdPattern)],
    role: ['WORKER' as UserRole, Validators.required],
    departmentId: ['']
  });

  ngOnInit(): void {
    this.loadDepartments();
    this.loadUsers();
  }

  loadDepartments(): void {
    const orgId = this.authService.user()?.organizationId;
    if (!orgId) {
      return;
    }

    this.organizationService.getDepartments(orgId).subscribe({
      next: departments => this.departments.set(departments)
    });
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.getUsers({ page: 0, size: 100 }).subscribe({
      next: (response) => {
        this.users.set(response.content);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  createUser(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const raw = this.form.getRawValue();
    this.userService.createUser({
      firstName: raw.firstName?.trim() ?? '',
      lastName: raw.lastName?.trim() ?? '',
      email: raw.email?.trim() ?? '',
      phone: raw.phone?.trim() ?? '',
      role: raw.role as UserRole,
      departmentId: raw.departmentId ? Number(raw.departmentId) : undefined,
      employeeId: raw.employeeId?.trim() ?? '',
      password: raw.password ?? undefined,
      organizationId: this.authService.user()?.organizationId
    }).subscribe({
      next: created => {
        const orgId = this.authService.user()?.organizationId;
        const departmentId = raw.departmentId ? Number(raw.departmentId) : undefined;
        if (orgId || departmentId) {
          this.userService.updateUser(created.id, {
            ...created,
            firstName: raw.firstName?.trim() ?? '',
            lastName: raw.lastName?.trim() ?? '',
            email: raw.email?.trim() ?? '',
            phone: raw.phone?.trim() ?? '',
            role: raw.role as UserRole,
            organizationId: orgId,
            departmentId
          }).subscribe({
            next: () => this.finishCreate(),
            error: () => this.finishCreate()
          });
          return;
        }
        this.finishCreate();
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.error('Create failed', err?.error?.message || 'Please try again');
      }
    });
  }

  toggleStatus(user: User): void {
    this.userService.toggleUserStatus(user.id).subscribe({
      next: (updated) => {
        this.users.update(list => list.map(item => item.id === updated.id ? updated : item));
        this.applyFilters();
        this.toastService.success('User updated', `${updated.firstName} ${updated.lastName}`.trim());
      },
      error: (err) => this.toastService.error('Update failed', err?.error?.message || 'Please try again')
    });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();
    const role = this.roleFilter;
    this.filteredUsers.set(this.users().filter(user => {
      const matchesRole = !role || user.role === role;
      const matchesSearch = !search || [
        user.firstName,
        user.lastName,
        user.email,
        user.departmentName
      ].some(value => (value ?? '').toLowerCase().includes(search));
      return matchesRole && matchesSearch;
    }));
  }

  editUser(user: User): void {
    this.selectedUser.set(user);
    this.editForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? '',
      employeeId: user.employeeId ?? '',
      role: user.role,
      departmentId: user.departmentId ? String(user.departmentId) : ''
    });
  }

  saveEdit(): void {
    const user = this.selectedUser();
    if (!user) {
      return;
    }
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const raw = this.editForm.getRawValue();
    this.userService.updateUser(user.id, {
      firstName: raw.firstName?.trim() ?? '',
      lastName: raw.lastName?.trim() ?? '',
      email: raw.email?.trim() ?? '',
      phone: raw.phone?.trim() ?? '',
      employeeId: raw.employeeId?.trim() ?? '',
      role: raw.role as UserRole,
      departmentId: raw.departmentId ? Number(raw.departmentId) : undefined,
      organizationId: this.authService.user()?.organizationId,
      isActive: user.isActive
    }).subscribe({
      next: updated => {
        this.users.update(list => list.map(item => item.id === updated.id ? updated : item));
        this.applyFilters();
        this.selectedUser.set(null);
        this.toastService.success('User saved', `${updated.firstName} ${updated.lastName}`.trim());
      },
      error: err => this.toastService.error('Save failed', err?.error?.message || 'Please try again')
    });
  }

  resetPassword(user: User): void {
    this.userService.resetUserPassword(user.id).subscribe({
      next: () => this.toastService.success('Password reset', `Temporary password reset for ${user.firstName}`),
      error: err => this.toastService.error('Reset failed', err?.error?.message || 'Please try again')
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Delete ${user.firstName} ${user.lastName}?`)) {
      return;
    }

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update(list => list.filter(item => item.id !== user.id));
        this.applyFilters();
        this.toastService.success('User deleted', `${user.firstName} ${user.lastName}`.trim());
      },
      error: err => this.toastService.error('Delete failed', err?.error?.message || 'Please try again')
    });
  }

  private finishCreate(): void {
    this.toastService.success('User created', 'The new user has been added');
    this.form.patchValue({ firstName: '', lastName: '', email: '', password: 'Test@1234', phone: '', employeeId: '', role: 'WORKER', departmentId: '' });
    this.loadUsers();
  }
}
