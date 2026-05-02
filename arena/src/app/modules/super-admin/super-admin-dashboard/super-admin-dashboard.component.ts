import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../../core/services/dashboard.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { UserService } from '../../../core/services/user.service';
import { PermitService } from '../../../core/services/permit.service';
import { DashboardStats, Organization, User, WorkPermit } from '../../../core/models';
import { PermitStatusBadgeComponent } from '../../../shared/components/permit-status-badge/permit-status-badge.component';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PermitStatusBadgeComponent],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>Super Admin Dashboard</h2>
          <p>Monitor organizations, users, and permit activity from a global system view.</p>
        </div>
        <div class="page-actions">
          <a routerLink="/super-admin/organizations" class="btn btn-secondary">Organizations</a>
          <a routerLink="/super-admin/reports" class="btn btn-primary">Reports</a>
        </div>
      </div>

      @if (loading()) {
        <div class="stats-grid">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="stat-card skeleton" style="min-height:110px;"></div>
          }
        </div>
      } @else {
        <div class="stats-grid">
          @for (card of statCards(); track card.title) {
            <div class="stat-card">
              <div class="stat-icon" [style.background]="card.bg">{{ card.icon }}</div>
              <div class="stat-content">
                <div class="stat-value">{{ card.value }}</div>
                <div class="stat-label">{{ card.title }}</div>
              </div>
            </div>
          }
        </div>

        <div class="dashboard-grid">
          <div class="card">
            <div class="card-header">
              <h3>Top Organizations</h3>
              <a routerLink="/super-admin/organizations" class="btn btn-ghost btn-sm">Manage</a>
            </div>
            <div class="card-body">
              <div class="org-grid">
                @for (org of organizations(); track org.id) {
                  <div class="org-card">
                    <div class="title">{{ org.name }}</div>
                    <div class="subtitle">{{ org.code }} · {{ org.city || 'No city' }}</div>
                    <div class="meta">
                      <span>{{ org.currentUsers || 0 }} users</span>
                      <span>{{ org.status }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Latest Users</h3>
              <a routerLink="/super-admin/users" class="btn btn-ghost btn-sm">Open</a>
            </div>
            <div class="card-body">
              <div class="user-stack">
                @for (user of users(); track user.id) {
                  <div class="user-row">
                    <div class="avatar">{{ initials(user) }}</div>
                    <div class="user-meta">
                      <div class="title">{{ user.firstName }} {{ user.lastName }}</div>
                      <div class="subtitle">{{ user.organizationName || 'Unassigned' }}</div>
                    </div>
                    <div class="pill">{{ user.role }}</div>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="card wide-card">
            <div class="card-header">
              <h3>Recent Permits</h3>
              <a routerLink="/super-admin/permits" class="btn btn-ghost btn-sm">Review</a>
            </div>
            <div class="card-body" style="padding:0;">
              <div class="table-wrapper" style="border:none;">
                <table class="table">
                  <thead>
                    <tr>
                      <th>Permit</th>
                      <th>Requester</th>
                      <th>Expiry</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (permit of permits(); track permit.id) {
                      <tr>
                        <td>
                          <div class="title">{{ permit.permitNumber }}</div>
                          <div class="subtitle">{{ permit.title }}</div>
                        </td>
                        <td>{{ permit.requestedByName }}</td>
                        <td>{{ (permit.expiryAt || permit.endDate) ? ((permit.expiryAt || permit.endDate) | date:'dd MMM yyyy') : 'Not set' }}</td>
                        <td><app-permit-status-badge type="status" [value]="permit.status"></app-permit-status-badge></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:24px; }
    .wide-card { grid-column: 1 / -1; }
    .org-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px; }
    .org-card, .user-row {
      padding:14px;
      border:1px solid var(--border);
      border-radius:14px;
      background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(239,246,255,0.92));
      transition: transform var(--transition-md), box-shadow var(--transition-md);
    }
    .org-card:hover, .user-row:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
    .user-stack { display:flex; flex-direction:column; gap:12px; }
    .user-row { display:flex; align-items:center; gap:12px; }
    .avatar {
      width:42px; height:42px; border-radius:12px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center; font-weight:700;
      background: var(--primary-light); color: var(--primary-dark);
    }
    .user-meta { flex:1; min-width:0; }
    .title { font-weight:600; color:var(--text-primary); }
    .subtitle { font-size:0.75rem; color:var(--text-muted); }
    .meta { display:flex; justify-content:space-between; margin-top:10px; font-size:0.75rem; color:var(--text-muted); }
    .pill {
      padding:6px 10px; border-radius:999px; background:var(--bg-tertiary);
      color:var(--text-secondary); font-size:0.72rem; font-weight:700;
    }
    @media (max-width: 960px) {
      .dashboard-grid { grid-template-columns: 1fr; }
      .wide-card { grid-column: auto; }
    }
  `]
})
export class SuperAdminDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private organizationService = inject(OrganizationService);
  private userService = inject(UserService);
  private permitService = inject(PermitService);

  loading = signal(true);
  stats = signal<DashboardStats | null>(null);
  organizations = signal<Organization[]>([]);
  users = signal<User[]>([]);
  permits = signal<WorkPermit[]>([]);

  ngOnInit(): void {
    forkJoin({
      stats: this.dashboardService.getStats(),
      organizations: this.organizationService.getOrganizations(0, 6, ''),
      users: this.userService.getUsers({ page: 0, size: 6 }),
      permits: this.permitService.getPermits({ page: 0, size: 6 })
    }).subscribe({
      next: ({ stats, organizations, users, permits }) => {
        this.stats.set(stats);
        this.organizations.set(organizations.content.slice(0, 6));
        this.users.set(users.content.slice(0, 6));
        this.permits.set(permits.content.slice(0, 6));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  statCards() {
    const colors = [
      { bg: '#dbeafe', icon: 'O' },
      { bg: '#dcfce7', icon: 'U' },
      { bg: '#fef3c7', icon: 'P' },
      { bg: '#fee2e2', icon: 'X' }
    ];
    return (this.stats()?.cards ?? []).slice(0, 4).map((card, index) => ({
      ...card,
      ...colors[index % colors.length]
    }));
  }

  initials(user: User): string {
    return `${user.firstName?.[0] ?? 'U'}${user.lastName?.[0] ?? ''}`.toUpperCase();
  }
}
