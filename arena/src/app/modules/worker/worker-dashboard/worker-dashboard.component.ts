import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PermitService } from '../../../core/services/permit.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { PermitStatusBadgeComponent } from '../../../shared/components/permit-status-badge/permit-status-badge.component';
import { WorkPermit, DashboardStats } from '../../../core/models';

@Component({
  selector: 'app-worker-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PermitStatusBadgeComponent],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>My Dashboard</h2>
          <p>Track and manage your work permit applications.</p>
        </div>
        <div class="page-actions">
          <a routerLink="/worker/apply-permit" class="btn btn-primary">Start New Permit</a>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background:#dbeafe;">P</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats()?.totalPermits ?? 0 }}</div>
            <div class="stat-label">Total Applications</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef9c3;">Q</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats()?.pendingPermits ?? 0 }}</div>
            <div class="stat-label">Pending Approval</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#dcfce7;">A</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats()?.activePermits ?? 0 }}</div>
            <div class="stat-label">Active Permits</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fee2e2;">E</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats()?.expiringSoon ?? 0 }}</div>
            <div class="stat-label">Expiring Soon</div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:24px;">
        <div class="card-header"><h3>Permit Workflow</h3></div>
        <div class="card-body">
          <div class="workflow-grid">
            <div class="workflow-step">Draft</div>
            <div class="workflow-step">Supervisor Review</div>
            <div class="workflow-step">Safety Review</div>
            <div class="workflow-step">Active / Close</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Recent Applications</h3>
          <a routerLink="/worker/my-permits" class="btn btn-secondary btn-sm">View All</a>
        </div>
        <div class="card-body" style="padding: 0;">
          @if (loading()) {
            <div style="padding: 40px; text-align: center; color: var(--text-muted);">Loading...</div>
          } @else if (recentPermits().length === 0) {
            <div class="empty-state">
              <div class="empty-icon">P</div>
              <h3>No permits yet</h3>
              <p>You haven't applied for any work permits. Start by creating a new permit.</p>
              <a routerLink="/worker/apply-permit" class="btn btn-primary">Apply Now</a>
            </div>
          } @else {
            <div class="table-wrapper" style="border: none; border-radius: 0;">
              <table class="table">
                <thead>
                  <tr>
                    <th>Permit #</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (permit of recentPermits(); track permit.id) {
                    <tr>
                      <td><strong>{{ permit.permitNumber }}</strong></td>
                      <td>{{ permit.title }}</td>
                      <td><app-permit-status-badge type="permit-type" [value]="permit.permitType"></app-permit-status-badge></td>
                      <td><app-permit-status-badge type="status" [value]="permit.status"></app-permit-status-badge></td>
                      <td>{{ permit.startDate | date:'dd MMM yyyy' }}</td>
                      <td><a [routerLink]="['/worker/permit', permit.id]" class="btn btn-ghost btn-sm">View</a></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .workflow-grid { display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap:12px; }
    .workflow-step {
      padding:14px;
      border-radius:14px;
      border:1px solid var(--border);
      background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(239,246,255,0.92));
      font-weight:600;
      color:var(--text-primary);
      text-align:center;
      transition: transform var(--transition-md), box-shadow var(--transition-md);
    }
    .workflow-step:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
    @media (max-width: 960px) {
      .workflow-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  `]
})
export class WorkerDashboardComponent implements OnInit {
  authService = inject(AuthService);
  private permitService = inject(PermitService);
  private dashboardService = inject(DashboardService);

  stats = signal<DashboardStats | null>(null);
  recentPermits = signal<WorkPermit[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: s => this.stats.set(s),
      error: () => {}
    });

    this.permitService.getMyPermits({ page: 0, size: 5 }).subscribe({
      next: p => {
        this.recentPermits.set(p.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
