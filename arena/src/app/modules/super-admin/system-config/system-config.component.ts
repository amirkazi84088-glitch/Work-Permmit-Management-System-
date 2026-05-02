import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-system-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>System Configuration</h2>
          <p>Review platform readiness, operating signals, and system-wide configuration status.</p>
        </div>
      </div>

      <div class="stats-grid">
        @for (item of cards(); track item.title) {
          <div class="stat-card">
            <div class="stat-icon" [style.background]="item.bg">{{ item.icon }}</div>
            <div class="stat-content">
              <div class="stat-value">{{ item.value }}</div>
              <div class="stat-label">{{ item.title }}</div>
            </div>
          </div>
        }
      </div>

      <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:24px;">
        <div class="card">
          <div class="card-header"><h3>Environment Readiness</h3></div>
          <div class="card-body">
            <div class="config-list">
              @for (item of configItems; track item.label) {
                <div class="config-row">
                  <div>
                    <div class="config-label">{{ item.label }}</div>
                    <div class="config-hint">{{ item.hint }}</div>
                  </div>
                  <div class="config-pill" [class.warn]="item.status !== 'Ready'">{{ item.status }}</div>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>Change Notes</h3></div>
          <div class="card-body">
            <div class="notes">
              <p>Dashboard, workflow, department, and reporting screens are now connected to live backend data.</p>
              <p>Editable platform settings will need dedicated backend endpoints before this page can move beyond system review mode.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .config-list { display:flex; flex-direction:column; gap:12px; }
    .config-row {
      display:flex; align-items:center; justify-content:space-between; gap:12px;
      padding:14px; border:1px solid var(--border); border-radius:12px;
      background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,250,252,0.95));
    }
    .config-label { font-weight:600; color:var(--text-primary); }
    .config-hint { font-size:0.78rem; color:var(--text-muted); }
    .config-pill {
      padding:6px 10px; border-radius:999px; background:var(--success-light);
      color:var(--success); font-size:0.75rem; font-weight:700;
    }
    .config-pill.warn { background:var(--warning-light); color:var(--warning); }
    .notes { display:flex; flex-direction:column; gap:12px; }
  `]
})
export class SystemConfigComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  cards = signal<Array<{ title: string; value: number | string; bg: string; icon: string }>>([]);
  configItems = [
    { label: 'JWT Authentication', hint: 'Login, profile, and password recovery are live.', status: 'Ready' },
    { label: 'Permit Workflow', hint: 'Worker, supervisor, and safety officer actions are connected.', status: 'Ready' },
    { label: 'Reporting', hint: 'Trend and permit type reports are printable and exportable.', status: 'Ready' },
    { label: 'Editable System Settings API', hint: 'No backend settings endpoint exists yet.', status: 'Read only' }
  ];

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: stats => {
        this.cards.set((stats.cards ?? []).slice(0, 4).map((card, index) => ({
          title: card.title,
          value: card.value,
          bg: ['#dbeafe', '#dcfce7', '#fef3c7', '#fee2e2'][index % 4],
          icon: ['S', 'U', 'P', 'R'][index % 4]
        })));
      }
    });
  }
}
