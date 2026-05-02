import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermitService } from '../../../core/services/permit.service';
import { WorkPermit, InspectionResult } from '../../../core/models';
import { PermitStatusBadgeComponent } from '../../../shared/components/permit-status-badge/permit-status-badge.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-inspections',
  standalone: true,
  imports: [CommonModule, FormsModule, PermitStatusBadgeComponent],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>Inspections</h2>
          <p>Manage inspection schedules, results, and follow-up actions.</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>Inspection Queue</h3></div>
        <div class="card-body" style="padding:0;">
          @if (loading()) {
            <div class="empty-state"><p>Loading inspection queue...</p></div>
          } @else {
            <div class="table-wrapper" style="border:none;">
              <table class="table">
                <thead>
                  <tr>
                    <th>Permit</th>
                    <th>Requester</th>
                    <th>Status</th>
                    <th>Inspection</th>
                  </tr>
                </thead>
                <tbody>
                  @for (permit of permits(); track permit.id) {
                    <tr>
                      <td>
                        <div style="font-weight:600;color:var(--text-primary);">{{ permit.permitNumber }}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted);">{{ permit.title }}</div>
                      </td>
                      <td>{{ permit.requestedByName }}</td>
                      <td><app-permit-status-badge type="status" [value]="permit.status"></app-permit-status-badge></td>
                      <td><button class="btn btn-ghost btn-sm" (click)="openModal(permit)">Log Inspection</button></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>

      @if (selectedPermit()) {
        <div class="modal-backdrop">
          <div class="modal modal-md">
            <div class="modal-header">
              <h3>Inspection for {{ selectedPermit()!.permitNumber }}</h3>
              <button class="btn btn-ghost btn-sm" (click)="selectedPermit.set(null)">x</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Result</label>
                <select class="form-control" [(ngModel)]="inspection.result">
                  <option value="PASSED">PASSED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="CONDITIONAL">CONDITIONAL</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Findings</label>
                <textarea class="form-control" rows="4" [(ngModel)]="inspection.findings"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Recommendations</label>
                <textarea class="form-control" rows="3" [(ngModel)]="inspection.recommendations"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" (click)="selectedPermit.set(null)">Cancel</button>
              <button class="btn btn-primary" (click)="submitInspection()">Save Inspection</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class InspectionsComponent implements OnInit {
  private permitService = inject(PermitService);
  private toastService = inject(ToastService);

  loading = signal(true);
  permits = signal<WorkPermit[]>([]);
  selectedPermit = signal<WorkPermit | null>(null);
  inspection: {
    result: InspectionResult;
    findings: string;
    recommendations: string;
    inspectionDate: string;
    followUpRequired: boolean;
  } = {
    result: 'PASSED',
    findings: '',
    recommendations: '',
    inspectionDate: new Date().toISOString(),
    followUpRequired: false
  };

  ngOnInit(): void {
    this.permitService.getPermits({ page: 0, size: 200 }).subscribe({
      next: response => {
        this.permits.set(response.content.filter(permit => ['ACTIVE', 'PENDING_SAFETY_OFFICER'].includes(permit.status)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openModal(permit: WorkPermit): void {
    this.selectedPermit.set(permit);
    this.inspection = {
      result: 'PASSED',
      findings: '',
      recommendations: '',
      inspectionDate: new Date().toISOString(),
      followUpRequired: false
    };
  }

  submitInspection(): void {
    const permit = this.selectedPermit();
    if (!permit) return;

    this.permitService.addInspection(permit.id, this.inspection).subscribe({
      next: () => {
        this.toastService.success('Inspection saved', `Inspection logged for ${permit.permitNumber}`);
        this.selectedPermit.set(null);
      },
      error: err => this.toastService.error('Inspection failed', err?.error?.message || 'Please try again')
    });
  }
}
