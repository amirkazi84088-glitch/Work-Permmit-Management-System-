import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../../core/services/dashboard.service';
import { PermitService } from '../../../core/services/permit.service';
import { UserService } from '../../../core/services/user.service';
import { DashboardStats, WorkPermit, User } from '../../../core/models';
import { PermitStatusBadgeComponent } from '../../../shared/components/permit-status-badge/permit-status-badge.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PermitStatusBadgeComponent],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>Admin Dashboard</h2>
          <p>Monitor permit throughput, users, and department operations for your organization.</p>
        </div>
        <div class="page-actions">
          <a routerLink="/admin/permits" class="btn btn-secondary">Review Permits</a>
          <a routerLink="/admin/users" class="btn btn-primary">Manage Users</a>
        </div>
      </div>

      @if (loading()) {
        <div class="stats-grid">
          @for (item of [1, 2, 3, 4]; track item) {
            <div class="stat-card skeleton-card"></div>
          }
        </div>
      } @else {
        <div class="stats-grid">
          @for (card of statCards(); track card.title) {
            <div class="stat-card accent-card" [style.--accent]="card.color">
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
              <h3>Recent Permits</h3>
              <a routerLink="/admin/permits" class="btn btn-ghost btn-sm">View All</a>
            </div>
            <div class="card-body card-body--tight">
              @if (recentPermits().length === 0) {
                <div class="empty-state compact-empty">
                  <p>No permits available.</p>
                </div>
              } @else {
                <div class="table-wrapper" style="border:none;">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>Permit</th>
                        <th>Requester</th>
                        <th>Status</th>
                        <th>Submitted</th>
                        <th>Expiry</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (permit of recentPermits(); track permit.id) {
                        <tr>
                          <td>
                            <div class="table-title">{{ permit.permitNumber }}</div>
                            <div class="table-subtitle">{{ permit.title }}</div>
                          </td>
                          <td>{{ permit.requestedByName }}</td>
                          <td><app-permit-status-badge type="status" [value]="permit.status"></app-permit-status-badge></td>
                          <td>{{ permit.submittedAt ? (permit.submittedAt | date:'dd MMM yyyy') : 'Draft' }}</td>
                          <td>{{ (permit.expiryAt || permit.endDate) ? ((permit.expiryAt || permit.endDate) | date:'dd MMM yyyy') : 'Not set' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Recently Added Users</h3>
              <a routerLink="/admin/users" class="btn btn-ghost btn-sm">Open Directory</a>
            </div>
            <div class="card-body">
              @if (recentUsers().length === 0) {
                <div class="empty-state compact-empty">
                  <p>No user records available.</p>
                </div>
              } @else {
                <div class="user-stack">
                  @for (user of recentUsers(); track user.id) {
                    <div class="user-row">
                      <div class="user-avatar">{{ initials(user) }}</div>
                      <div class="user-meta">
                        <div class="table-title">{{ user.firstName }} {{ user.lastName }}</div>
                        <div class="table-subtitle">{{ user.email }}</div>
                      </div>
                      <div class="badge-chip">{{ user.role.replace('_', ' ') }}</div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-grid { display:grid; grid-template-columns: 1.4fr 1fr; gap:24px; }
    .card-body--tight { padding: 0; }
    .skeleton-card { min-height: 112px; }
    .accent-card { position: relative; overflow: hidden; }
    .accent-card::after {
      content: '';
      position: absolute;
      inset: auto -30px -30px auto;
      width: 88px;
      height: 88px;
      border-radius: 50%;
      background: color-mix(in srgb, var(--accent) 16%, transparent);
    }
    .table-title { font-weight: 600; color: var(--text-primary); }
    .table-subtitle { font-size: 0.75rem; color: var(--text-muted); }
    .compact-empty { min-height: 220px; }
    .user-stack { display:flex; flex-direction:column; gap:12px; }
    .user-row {
      display:flex;
      align-items:center;
      gap:12px;
      padding:14px;
      border:1px solid var(--border);
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(255,255,255,0.96), rgba(241,245,249,0.96));
      transition: transform var(--transition-md), box-shadow var(--transition-md);
    }
    .user-row:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
    .user-avatar {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display:flex;
      align-items:center;
      justify-content:center;
      background: var(--primary-light);
      color: var(--primary-dark);
      font-weight: 700;
      flex-shrink: 0;
    }
    .user-meta { flex: 1; min-width: 0; }
    .badge-chip {
      padding: 6px 10px;
      border-radius: 999px;
      background: var(--bg-tertiary);
      color: var(--text-secondary);
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: capitalize;
    }
    @media (max-width: 960px) {
      .dashboard-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private permitService = inject(PermitService);
  private userService = inject(UserService);

  loading = signal(true);
  stats = signal<DashboardStats | null>(null);
  recentPermits = signal<WorkPermit[]>([]);
  recentUsers = signal<User[]>([]);

  ngOnInit(): void {
    forkJoin({
      stats: this.dashboardService.getStats(),
      permits: this.permitService.getPermits({ page: 0, size: 5 }),
      users: this.userService.getUsers({ page: 0, size: 5 })
    }).subscribe({
      next: ({ stats, permits, users }) => {
        this.stats.set(stats);
        this.recentPermits.set(permits.content.slice(0, 5));
        this.recentUsers.set(users.content.slice(0, 5));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  statCards() {
    const palette = [
      { color: '#2563eb', bg: '#dbeafe', icon: 'P' },
      { color: '#0891b2', bg: '#cffafe', icon: 'U' },
      { color: '#ca8a04', bg: '#fef3c7', icon: 'A' },
      { color: '#dc2626', bg: '#fee2e2', icon: 'E' }
    ];

    return (this.stats()?.cards ?? []).slice(0, 4).map((card, index) => ({
      title: card.title,
      value: card.value,
      ...palette[index % palette.length]
    }));
  }

  initials(user: User): string {
    return `${user.firstName?.[0] ?? 'U'}${user.lastName?.[0] ?? ''}`.toUpperCase();
  }
}
