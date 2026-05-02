import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PermitService } from '../../../core/services/permit.service';
import { WorkPermit } from '../../../core/models';
import { PermitStatusBadgeComponent } from '../../../shared/components/permit-status-badge/permit-status-badge.component';

@Component({
  selector: 'app-active-permits',
  standalone: true,
  imports: [CommonModule, RouterLink, PermitStatusBadgeComponent],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>Safety Review Queue</h2>
          <p>Review pending safety approvals and track permits already active in the field.</p>
        </div>
      </div>

      <div class="card" style="margin-bottom:24px;">
        <div class="card-header"><h3>Pending Safety Approvals</h3></div>
        <div class="card-body" style="padding:0;">
          @if (loading()) {
            <div class="empty-state"><p>Loading permits...</p></div>
          } @else if (pendingPermits().length === 0) {
            <div class="empty-state">
              <h3>No permits waiting</h3>
              <p>There are currently no permits waiting for safety officer review.</p>
            </div>
          } @else {
            <div class="table-wrapper" style="border:none;">
              <table class="table">
                <thead>
                  <tr>
                    <th>Permit #</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Requested By</th>
                    <th>Expiry</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (permit of pendingPermits(); track permit.id) {
                    <tr>
                      <td>{{ permit.permitNumber }}</td>
                      <td>{{ permit.title }}</td>
                      <td><app-permit-status-badge type="permit-type" [value]="permit.permitType"></app-permit-status-badge></td>
                      <td><app-permit-status-badge type="status" [value]="permit.status"></app-permit-status-badge></td>
                      <td>{{ permit.requestedByName }}</td>
                      <td>{{ (permit.expiryAt || permit.endDate) ? ((permit.expiryAt || permit.endDate) | date:'dd MMM yyyy, HH:mm') : 'Not set' }}</td>
                      <td><a class="btn btn-ghost btn-sm" [routerLink]="['/safety-officer/permit', permit.id]">Review</a></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>Active Field Permits</h3></div>
        <div class="card-body" style="padding:0;">
          @if (loading()) {
            <div class="empty-state"><p>Loading permits...</p></div>
          } @else if (activePermits().length === 0) {
            <div class="empty-state">
              <h3>No active permits</h3>
              <p>There are no active permits requiring field monitoring.</p>
            </div>
          } @else {
            <div class="table-wrapper" style="border:none;">
              <table class="table">
                <thead>
                  <tr>
                    <th>Permit #</th>
                    <th>Title</th>
                    <th>Requested By</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (permit of activePermits(); track permit.id) {
                    <tr>
                      <td>{{ permit.permitNumber }}</td>
                      <td>{{ permit.title }}</td>
                      <td>{{ permit.requestedByName }}</td>
                      <td>{{ (permit.expiryAt || permit.endDate) ? ((permit.expiryAt || permit.endDate) | date:'dd MMM yyyy, HH:mm') : 'Not set' }}</td>
                      <td><app-permit-status-badge type="status" [value]="permit.status"></app-permit-status-badge></td>
                      <td><a class="btn btn-ghost btn-sm" [routerLink]="['/safety-officer/permit', permit.id]">Inspect</a></td>
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
export class ActivePermitsComponent implements OnInit {
  private permitService = inject(PermitService);

  pendingPermits = signal<WorkPermit[]>([]);
  activePermits = signal<WorkPermit[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.permitService.getPendingApprovals({ page: 0, size: 50 }).subscribe({
      next: pending => {
        this.pendingPermits.set(pending.content);
        this.permitService.getPermits({ page: 0, size: 200 }).subscribe({
          next: permits => {
            this.activePermits.set(permits.content.filter(permit => permit.status === 'ACTIVE'));
            this.loading.set(false);
          },
          error: () => this.loading.set(false)
        });
      },
      error: () => this.loading.set(false)
    });
  }
}
