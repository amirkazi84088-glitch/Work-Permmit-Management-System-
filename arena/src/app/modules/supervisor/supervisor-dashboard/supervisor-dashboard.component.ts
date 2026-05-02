import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DashboardService } from '../../../core/services/dashboard.service';
import { PermitService } from '../../../core/services/permit.service';
import { DashboardStats, WorkPermit } from '../../../core/models';
import { PermitStatusBadgeComponent } from '../../../shared/components/permit-status-badge/permit-status-badge.component';

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PermitStatusBadgeComponent],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>Supervisor Dashboard</h2>
          <p>Track pending approvals, monitor team permits, and keep workflow moving.</p>
        </div>
        <div class="page-actions">
          <a routerLink="/supervisor/pending-approvals" class="btn btn-primary">Open Queue</a>
        </div>
      </div>

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

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px;">
        <div class="card">
          <div class="card-header"><h3>Pending Approvals</h3></div>
          <div class="card-body">
            @if (pendingPermits().length === 0) {
              <div class="empty-state compact-empty"><p>No permits are awaiting action.</p></div>
            } @else {
              <div class="mini-list">
                @for (permit of pendingPermits(); track permit.id) {
                  <a class="mini-item" [routerLink]="['/supervisor/permit', permit.id]">
                    <div>
                      <div class="title">{{ permit.permitNumber }}</div>
                      <div class="subtitle">{{ permit.title }}</div>
                      <div class="subtitle">Expiry: {{ (permit.expiryAt || permit.endDate) ? ((permit.expiryAt || permit.endDate) | date:'dd MMM yyyy, HH:mm') : 'Not set' }}</div>
                    </div>
                    <app-permit-status-badge type="status" [value]="permit.status"></app-permit-status-badge>
                  </a>
                }
              </div>
            }
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>Recent Team Permits</h3></div>
          <div class="card-body">
            @if (teamPermits().length === 0) {
              <div class="empty-state compact-empty"><p>No team permits found.</p></div>
            } @else {
              <div class="mini-list">
                @for (permit of teamPermits(); track permit.id) {
                  <a class="mini-item" [routerLink]="['/supervisor/permit', permit.id]">
                    <div>
                      <div class="title">{{ permit.title }}</div>
                      <div class="subtitle">{{ permit.requestedByName }}</div>
                      <div class="subtitle">Expiry: {{ (permit.expiryAt || permit.endDate) ? ((permit.expiryAt || permit.endDate) | date:'dd MMM yyyy, HH:mm') : 'Not set' }}</div>
                    </div>
                    <app-permit-status-badge type="status" [value]="permit.status"></app-permit-status-badge>
                  </a>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mini-list { display:flex; flex-direction:column; gap:12px; }
    .mini-item {
      display:flex; align-items:center; justify-content:space-between; gap:12px;
      padding:14px; border:1px solid var(--border); border-radius:14px;
      background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(239,246,255,0.95));
      text-decoration:none;
    }
    .title { font-weight:600; color:var(--text-primary); }
    .subtitle { font-size:0.75rem; color:var(--text-muted); }
    .compact-empty { min-height:180px; }
  `]
})
export class SupervisorDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private permitService = inject(PermitService);

  stats = signal<DashboardStats | null>(null);
  pendingPermits = signal<WorkPermit[]>([]);
  teamPermits = signal<WorkPermit[]>([]);

  ngOnInit(): void {
    forkJoin({
      stats: this.dashboardService.getStats(),
      pending: this.permitService.getPendingApprovals({ page: 0, size: 5 }),
      permits: this.permitService.getPermits({ page: 0, size: 6 })
    }).subscribe({
      next: ({ stats, pending, permits }) => {
        this.stats.set(stats);
        this.pendingPermits.set(pending.content.slice(0, 5));
        this.teamPermits.set(permits.content.slice(0, 6));
      }
    });
  }

  statCards() {
    return (this.stats()?.cards ?? []).slice(0, 4).map((card, index) => ({
      ...card,
      bg: ['#dbeafe', '#fef3c7', '#e0f2fe', '#dcfce7'][index % 4],
      icon: ['Q', 'A', 'T', 'N'][index % 4]
    }));
  }
}
