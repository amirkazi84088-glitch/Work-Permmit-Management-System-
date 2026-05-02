import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PermitService } from '../../../core/services/permit.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>Reports</h2>
          <p>Generate printable operational reports with permit trends and type distribution.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" (click)="downloadExport()">Download CSV</button>
          <button class="btn btn-primary" (click)="printPage()">Print Report</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>Filters</h3></div>
        <div class="card-body">
          <form [formGroup]="form" (ngSubmit)="loadReports()" style="display:flex; gap:12px; align-items:end; flex-wrap:wrap;">
            <div class="form-group" style="margin:0;">
              <label class="form-label">Start Date</label>
              <input class="form-control" type="date" formControlName="startDate" />
              @if (form.get('startDate')?.touched && form.get('startDate')?.hasError('required')) {
                <div class="form-error">Start date is required</div>
              }
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label">End Date</label>
              <input class="form-control" type="date" formControlName="endDate" />
              @if (form.get('endDate')?.touched && form.get('endDate')?.hasError('required')) {
                <div class="form-error">End date is required</div>
              }
              @if (form.errors?.['invalidDateRange'] && form.get('endDate')?.touched) {
                <div class="form-error">End date must be on or after start date</div>
              }
            </div>
            <button class="btn btn-primary" type="submit">Load</button>
          </form>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card report-accent">
          <div class="stat-icon" style="background: var(--primary-light);">T</div>
          <div class="stat-content">
            <div class="stat-value">{{ totalTrendCount() }}</div>
            <div class="stat-label">Permits In Range</div>
          </div>
        </div>
        <div class="stat-card report-accent">
          <div class="stat-icon" style="background: var(--warning-light);">P</div>
          <div class="stat-content">
            <div class="stat-value">{{ topTypeName() }}</div>
            <div class="stat-label">Top Permit Type</div>
          </div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; align-items:start;">
        <div class="card">
          <div class="card-header"><h3>Permit Trend</h3></div>
          <div class="card-body">
            @if (loading()) {
              <p>Loading report data...</p>
            } @else if (trend().length === 0) {
              <p>No permit trend data available for the selected range.</p>
            } @else {
              <table class="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of trend(); track item.date) {
                    <tr>
                      <td>{{ item.date | date:'dd MMM yyyy' }}</td>
                      <td>{{ item.count }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>Permit Type Distribution</h3></div>
          <div class="card-body">
            @if (loading()) {
              <p>Loading report data...</p>
            } @else if (types().length === 0) {
              <p>No permit type data available.</p>
            } @else {
              <table class="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Checklist</th>
                    <th>Permits</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of types(); track item.permitTypeId) {
                    <tr>
                      <td>{{ item.name }}</td>
                      <td>{{ item.checklistCount }}</td>
                      <td>{{ item.permitCount }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .report-accent:hover { transform: translateY(-2px); }
    @media print {
      .page-actions, .card:first-of-type { display:none !important; }
      .page-wrapper { padding: 0; }
      .card, .stat-card { box-shadow:none; break-inside: avoid; }
    }
  `]
})
export class ReportsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private permitService = inject(PermitService);
  private toastService = inject(ToastService);

  loading = signal(false);
  trend = signal<Array<{ date: string; count: number }>>([]);
  types = signal<Array<{ permitTypeId: number; name: string; description?: string; checklistCount: number; permitCount: number }>>([]);

  form = this.fb.group({
    startDate: [this.toDateInput(this.daysAgo(30)), Validators.required],
    endDate: [this.toDateInput(new Date()), Validators.required]
  }, { validators: this.dateRangeValidator });

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    const { startDate, endDate } = this.form.getRawValue();
    if (this.form.invalid || !startDate || !endDate) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.permitService.getPermitTrend(startDate, endDate).subscribe({
      next: (trend) => {
        this.trend.set(trend);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });

    this.permitService.getPermitTypeDistribution().subscribe({
      next: (types) => this.types.set(types),
      error: () => {}
    });
  }

  totalTrendCount(): number {
    return this.trend().reduce((sum, item) => sum + item.count, 0);
  }

  topTypeName(): string {
    const top = [...this.types()].sort((a, b) => b.permitCount - a.permitCount)[0];
    return top?.name ?? 'N/A';
  }

  downloadExport(): void {
    this.permitService.exportPermits({}, 'PDF').subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'permit-report.csv';
        anchor.click();
        URL.revokeObjectURL(url);
        this.toastService.success('Report downloaded', 'The report export has been generated');
      },
      error: err => this.toastService.error('Export failed', err?.error?.message || 'Unable to export the report')
    });
  }

  printPage(): void {
    window.print();
  }

  private daysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  private toDateInput(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private dateRangeValidator(group: FormGroup) {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    if (!start || !end) {
      return null;
    }
    return new Date(end) >= new Date(start) ? null : { invalidDateRange: true };
  }
}
