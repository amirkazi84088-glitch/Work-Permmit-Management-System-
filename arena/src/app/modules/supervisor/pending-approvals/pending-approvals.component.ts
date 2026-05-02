import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PermitService } from '../../../core/services/permit.service';
import { WorkPermit } from '../../../core/models';
import { PermitStatusBadgeComponent } from '../../../shared/components/permit-status-badge/permit-status-badge.component';

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [CommonModule, RouterLink, PermitStatusBadgeComponent],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>Pending Approvals</h2>
          <p>Review permit requests awaiting action.</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Approval Queue</h3>
        </div>
        <div class="card-body" style="padding:0;">
          @if (loading()) {
            <div class="empty-state"><p>Loading approval queue...</p></div>
          } @else if (permits().length === 0) {
            <div class="empty-state">
              <h3>No pending approvals</h3>
              <p>There are currently no submitted permits waiting for review.</p>
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
                  @for (permit of permits(); track permit.id) {
                    <tr>
                      <td>{{ permit.permitNumber }}</td>
                      <td>{{ permit.title }}</td>
                      <td><app-permit-status-badge type="permit-type" [value]="permit.permitType"></app-permit-status-badge></td>
                      <td><app-permit-status-badge type="status" [value]="permit.status"></app-permit-status-badge></td>
                      <td>{{ permit.requestedByName }}</td>
                      <td>{{ (permit.expiryAt || permit.endDate) ? ((permit.expiryAt || permit.endDate) | date:'dd MMM yyyy, HH:mm') : 'Not set' }}</td>
                      <td><a class="btn btn-ghost btn-sm" [routerLink]="['/supervisor/permit', permit.id]">Review</a></td>
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
export class PendingApprovalsComponent implements OnInit {
  private permitService = inject(PermitService);

  permits = signal<WorkPermit[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.permitService.getPendingApprovals({ page: 0, size: 50 }).subscribe({
      next: (response) => {
        this.permits.set(response.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
