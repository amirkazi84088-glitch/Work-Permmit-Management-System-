import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { User, Organization, UserRole } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-all-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>All Users</h2>
          <p>Review users across all organizations from a system-wide view.</p>
        </div>
      </div>

      <div class="filter-bar">
        <div class="search-wrapper">
          <span class="search-icon">⌕</span>
          <input class="form-control" [(ngModel)]="searchTerm" (input)="applyFilters()" placeholder="Search name or email" />
        </div>
        <select class="form-control filter-select" [(ngModel)]="roleFilter" (change)="applyFilters()">
          <option value="">All roles</option>
          @for (role of roles; track role) {
            <option [value]="role">{{ role }}</option>
          }
        </select>
        <select class="form-control filter-select" [(ngModel)]="orgFilter" (change)="applyFilters()">
          <option value="">All organizations</option>
          @for (org of organizations(); track org.id) {
            <option [value]="org.id">{{ org.name }}</option>
          }
        </select>
      </div>

      <div class="card">
        <div class="card-header"><h3>Global User Directory</h3></div>
        <div class="card-body" style="padding:0;">
          @if (loading()) {
            <div class="empty-state"><p>Loading users...</p></div>
          } @else {
            <div class="table-wrapper" style="border:none;">
              <table class="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Organization</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (user of filteredUsers(); track user.id) {
                    <tr>
                      <td>
                        <div style="font-weight:600;color:var(--text-primary);">{{ user.firstName }} {{ user.lastName }}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted);">{{ user.email }}</div>
                      </td>
                      <td>{{ user.organizationName || 'Unassigned' }}</td>
                      <td>{{ user.role }}</td>
                      <td>{{ user.isActive ? 'Active' : 'Inactive' }}</td>
                      <td>
                        <div style="display:flex; gap:4px;">
                          <button class="btn btn-ghost btn-sm" (click)="toggleStatus(user)">{{ user.isActive ? 'Disable' : 'Enable' }}</button>
                          <button class="btn btn-ghost btn-sm" (click)="resetPassword(user)">Reset</button>
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
  `
})
export class AllUsersComponent implements OnInit {
  private userService = inject(UserService);
  private organizationService = inject(OrganizationService);
  private toastService = inject(ToastService);

  loading = signal(true);
  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  organizations = signal<Organization[]>([]);
  searchTerm = '';
  roleFilter = '';
  orgFilter = '';
  roles: UserRole[] = ['WORKER', 'SUPERVISOR', 'SAFETY_OFFICER', 'PERMIT_APPROVER', 'ADMIN', 'SUPER_ADMIN'];

  ngOnInit(): void {
    this.organizationService.getOrganizations(0, 100, '').subscribe({
      next: response => this.organizations.set(response.content)
    });

    this.userService.getUsers({ page: 0, size: 200 }).subscribe({
      next: response => {
        this.users.set(response.content);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();
    const role = this.roleFilter;
    const orgId = this.orgFilter ? Number(this.orgFilter) : null;
    this.filteredUsers.set(this.users().filter(user => {
      const matchesSearch = !search || [user.firstName, user.lastName, user.email].some(value => (value ?? '').toLowerCase().includes(search));
      const matchesRole = !role || user.role === role;
      const matchesOrg = !orgId || user.organizationId === orgId;
      return matchesSearch && matchesRole && matchesOrg;
    }));
  }

  toggleStatus(user: User): void {
    this.userService.toggleUserStatus(user.id).subscribe({
      next: updated => {
        this.users.update(list => list.map(item => item.id === updated.id ? updated : item));
        this.applyFilters();
        this.toastService.success('User updated', `${updated.firstName} ${updated.lastName}`.trim());
      },
      error: err => this.toastService.error('Update failed', err?.error?.message || 'Please try again')
    });
  }

  resetPassword(user: User): void {
    this.userService.resetUserPassword(user.id).subscribe({
      next: () => this.toastService.success('Password reset', `Password reset for ${user.firstName}`),
      error: err => this.toastService.error('Reset failed', err?.error?.message || 'Please try again')
    });
  }
}
