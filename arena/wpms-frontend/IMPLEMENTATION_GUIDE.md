# WPMS Frontend - Implementation Guide

This guide helps you complete the remaining dashboard and feature components for Supervisor, Safety Officer, Admin, and Super Admin roles.

---

## 📋 What's Already Built (100% Complete)

✅ **Core Infrastructure**
- Authentication system (login, forgot password, reset password)
- JWT interceptor with auto token refresh
- Auth & role guards
- All services (Auth, Permit, User, Organization, Notification, Dashboard, Toast)
- TypeScript models and interfaces
- HTTP client configuration

✅ **Shared Components**
- Shell layout (header + sidebar wrapper)
- Header with notifications and user menu
- Sidebar with role-based navigation
- Toast notification system
- Profile component (shared across all roles)
- Permit status badge component

✅ **Worker Module (100% Complete)**
- Worker dashboard with stats
- Apply for permit (full form with hazards, precautions)
- My permits list (with search, filters, pagination)
- Permit detail view (works for all roles)

✅ **Routing**
- All route files created for all 5 roles
- Lazy-loaded modules
- Role-based guards applied

---

## 🚧 Components to Implement

You need to create **placeholder or full implementations** for these components. I'll provide templates below.

### **Supervisor Module**
1. `supervisor-dashboard.component.ts` ✅ (placeholder created)
2. `pending-approvals.component.ts` - List of permits awaiting supervisor approval
3. `team-permits.component.ts` - All permits from the supervisor's team

### **Safety Officer Module**
1. `safety-officer-dashboard.component.ts` - Dashboard with inspection stats
2. `active-permits.component.ts` - All currently active permits requiring safety oversight
3. `inspections.component.ts` - Create and view permit inspections
4. `audit-log.component.ts` - Audit trail of all permit actions

### **Admin Module**
1. `admin-dashboard.component.ts` - Organization-level dashboard
2. `user-management.component.ts` - CRUD users within organization
3. `departments.component.ts` - Manage departments
4. `all-permits.component.ts` - View all permits in the organization
5. `reports.component.ts` - Generate permit reports

### **Super Admin Module**
1. `super-admin-dashboard.component.ts` - Global dashboard across all organizations
2. `organizations.component.ts` - CRUD organizations
3. `all-users.component.ts` - Manage users across all organizations
4. `global-permits.component.ts` - View all permits globally
5. `system-config.component.ts` - System-wide configuration
6. `global-reports.component.ts` - Cross-organization reporting

---

## 📝 Component Templates

Here are reusable templates you can adapt for each component:

### Template 1: **Simple List Component** (Pending Approvals, Team Permits, Active Permits, All Permits, Global Permits)

```typescript
import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PermitService } from '../../../core/services/permit.service';
import { PermitStatusBadgeComponent } from '../../../shared/components/permit-status-badge/permit-status-badge.component';
import { WorkPermit } from '../../../core/models';

@Component({
  selector: 'app-YOUR-COMPONENT-NAME',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PermitStatusBadgeComponent],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>TITLE HERE</h2>
          <p>DESCRIPTION HERE</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" class="form-control" placeholder="Search permits..."
            [(ngModel)]="searchTerm" (input)="onSearch()" />
        </div>
        <select class="form-control filter-select" [(ngModel)]="statusFilter" (change)="onFilter()">
          <option value="">All Statuses</option>
          <option value="PENDING_SUPERVISOR">Pending Supervisor</option>
          <option value="PENDING_SAFETY_OFFICER">Pending Safety Officer</option>
          <option value="APPROVED">Approved</option>
          <option value="ACTIVE">Active</option>
        </select>
      </div>

      <!-- Permits Table -->
      <div class="card">
        @if (loading()) {
          <div style="padding: 60px; text-align: center; color: var(--text-muted);">
            <div style="font-size: 32px; margin-bottom: 12px;">⏳</div>
            Loading permits...
          </div>
        } @else if (permits().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>No permits found</h3>
            <p>No permits match your current filters.</p>
          </div>
        } @else {
          <div class="table-wrapper" style="border: none;">
            <table class="table">
              <thead>
                <tr>
                  <th>Permit #</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (permit of permits(); track permit.id) {
                  <tr>
                    <td><strong>{{ permit.permitNumber }}</strong></td>
                    <td>{{ permit.title }}</td>
                    <td><app-permit-status-badge type="permit-type" [value]="permit.permitType"></app-permit-status-badge></td>
                    <td><app-permit-status-badge type="status" [value]="permit.status"></app-permit-status-badge></td>
                    <td>{{ permit.startDate | date:'dd MMM yyyy' }}</td>
                    <td>
                      <a [routerLink]="['/YOUR-ROLE/permit', permit.id]" class="btn btn-ghost btn-sm">View</a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  `
})
export class YourComponentName implements OnInit {
  private permitService = inject(PermitService);
  
  permits = signal<WorkPermit[]>([]);
  loading = signal(true);
  searchTerm = '';
  statusFilter = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    // For pending approvals (Supervisor): this.permitService.getPendingApprovals()
    // For all permits (Admin): this.permitService.getPermits()
    // Adjust based on role
    this.permitService.getPermits({ 
      search: this.searchTerm, 
      status: this.statusFilter as any 
    }).subscribe({
      next: (p) => { this.permits.set(p.content); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch(): void { this.load(); }
  onFilter(): void { this.load(); }
}
```

### Template 2: **User Management Component**

```typescript
import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>User Management</h2>
          <p>Manage users in your organization</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-primary" (click)="openCreateModal()">➕ Add User</button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="card">
        <div class="table-wrapper" style="border: none;">
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td><strong>{{ user.firstName }} {{ user.lastName }}</strong></td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.role }}</td>
                  <td>
                    <span class="badge" [class]="user.isActive ? 'badge-approved' : 'badge-rejected'">
                      {{ user.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-ghost btn-sm" (click)="editUser(user)">Edit</button>
                    <button class="btn btn-ghost btn-sm" (click)="toggleStatus(user)">
                      {{ user.isActive ? 'Deactivate' : 'Activate' }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      @if (showModal()) {
        <div class="modal-backdrop">
          <div class="modal modal-md">
            <div class="modal-header">
              <h3>{{ editingUser() ? 'Edit User' : 'Create User' }}</h3>
              <button class="btn btn-ghost btn-sm" (click)="showModal.set(false)">✕</button>
            </div>
            <form [formGroup]="userForm" (ngSubmit)="saveUser()">
              <div class="modal-body">
                <div class="form-grid cols-2">
                  <div class="form-group">
                    <label class="form-label">First Name</label>
                    <input type="text" formControlName="firstName" class="form-control" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Last Name</label>
                    <input type="text" formControlName="lastName" class="form-control" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Email</label>
                  <input type="email" formControlName="email" class="form-control" />
                </div>
                <div class="form-group">
                  <label class="form-label">Role</label>
                  <select formControlName="role" class="form-control">
                    <option value="WORKER">Worker</option>
                    <option value="SUPERVISOR">Supervisor</option>
                    <option value="SAFETY_OFFICER">Safety Officer</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showModal.set(false)">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="loading()">
                  @if (loading()) { <span class="btn-spinner"></span> Saving... }
                  @else { Save }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  users = signal<User[]>([]);
  loading = signal(false);
  showModal = signal(false);
  editingUser = signal<User | null>(null);
  userForm!: FormGroup;

  ngOnInit(): void {
    this.userForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['WORKER', Validators.required]
    });
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (p) => this.users.set(p.content),
      error: () => {}
    });
  }

  openCreateModal(): void {
    this.editingUser.set(null);
    this.userForm.reset({ role: 'WORKER' });
    this.showModal.set(true);
  }

  editUser(user: User): void {
    this.editingUser.set(user);
    this.userForm.patchValue(user);
    this.showModal.set(true);
  }

  saveUser(): void {
    if (this.userForm.invalid) return;
    this.loading.set(true);
    const obs = this.editingUser()
      ? this.userService.updateUser(this.editingUser()!.id, this.userForm.value)
      : this.userService.createUser(this.userForm.value);
    
    obs.subscribe({
      next: () => {
        this.loading.set(false);
        this.showModal.set(false);
        this.toastService.success('Success', 'User saved');
        this.loadUsers();
      },
      error: () => this.loading.set(false)
    });
  }

  toggleStatus(user: User): void {
    this.userService.toggleUserStatus(user.id).subscribe({
      next: () => this.loadUsers(),
      error: () => {}
    });
  }
}
```

### Template 3: **Dashboard Component**

```typescript
import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { DashboardStats } from '../../../core/models';

@Component({
  selector: 'app-ROLE-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>ROLE Dashboard</h2>
          <p>Overview and statistics</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:#dbeafe;">📋</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats()?.totalPermits ?? 0 }}</div>
            <div class="stat-label">Total Permits</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef9c3;">⏳</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats()?.pendingPermits ?? 0 }}</div>
            <div class="stat-label">Pending</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dcfce7;">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats()?.activePermits ?? 0 }}</div>
            <div class="stat-label">Active</div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="card">
        <div class="card-header"><h3>Recent Activity</h3></div>
        <div class="card-body">
          @if (stats()?.recentActivity?.length) {
            @for (activity of stats()!.recentActivity; track activity.id) {
              <div style="padding: 12px; border-bottom: 1px solid var(--border);">
                <div style="font-size: 0.875rem;">{{ activity.description }}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                  {{ activity.timestamp | date:'dd MMM yyyy, HH:mm' }}
                </div>
              </div>
            }
          } @else {
            <div class="empty-state" style="padding: 40px;">
              <p>No recent activity</p>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class RoleDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  stats = signal<DashboardStats | null>(null);

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: (s) => this.stats.set(s),
      error: () => {}
    });
  }
}
```

---

## 🔧 Quick Implementation Steps

1. **Extract all 3 zip files** to the same `wpms-frontend` directory
2. **Run `npm install`** to install dependencies
3. **For each missing component**, copy the appropriate template above
4. **Adjust** the component name, selector, API calls, and routing paths
5. **Test** each module by logging in with different roles

---

## ✅ Verification Checklist

After implementing all components:

- [ ] Worker can log in and see worker dashboard
- [ ] Worker can apply for permits and view "My Permits"
- [ ] Supervisor can log in and see supervisor dashboard
- [ ] Safety Officer can log in and see safety officer dashboard
- [ ] Admin can log in and see admin dashboard
- [ ] Super Admin can log in and see super admin dashboard
- [ ] All roles can view permit details
- [ ] All roles can access their profile page
- [ ] Sidebar navigation works for all roles
- [ ] Notifications load in header
- [ ] Logout works correctly

---

## 🎯 Final Notes

- The **PermitDetailComponent** is already fully built and shared across all roles
- The **ProfileComponent** is shared across all roles
- All **services** are complete and ready to use
- **Authentication** and **routing** are 100% done
- You just need to create the **dashboard and list components** using the templates above

**Estimated time to complete**: 2-3 hours if using the templates

Good luck! 🚀
