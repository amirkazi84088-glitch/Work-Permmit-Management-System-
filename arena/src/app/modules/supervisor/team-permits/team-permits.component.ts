import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PermitService } from '../../../core/services/permit.service';
import { WorkPermit } from '../../../core/models';
import { PermitStatusBadgeComponent } from '../../../shared/components/permit-status-badge/permit-status-badge.component';

@Component({
  selector: 'app-team-permits',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PermitStatusBadgeComponent],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>Team Permits</h2>
          <p>View permit activity for workers under your supervision.</p>
        </div>
      </div>

      <div class="filter-bar">
        <div class="search-wrapper">
          <span class="search-icon">⌕</span>
          <input class="form-control" [(ngModel)]="searchTerm" (input)="applyFilters()" placeholder="Search team permits" />
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>Team Activity</h3></div>
        <div class="card-body" style="padding:0;">
          @if (loading()) {
            <div class="empty-state"><p>Loading permits...</p></div>
          } @else {
            <div class="table-wrapper" style="border:none;">
              <table class="table">
                <thead>
                  <tr>
                    <th>Permit</th>
                    <th>Requester</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Expiry</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (permit of filteredPermits(); track permit.id) {
                    <tr>
                      <td>
                        <div style="font-weight:600;color:var(--text-primary);">{{ permit.permitNumber }}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted);">{{ permit.title }}</div>
                      </td>
                      <td>{{ permit.requestedByName }}</td>
                      <td><app-permit-status-badge type="permit-type" [value]="permit.permitType"></app-permit-status-badge></td>
                      <td><app-permit-status-badge type="status" [value]="permit.status"></app-permit-status-badge></td>
                      <td>{{ (permit.expiryAt || permit.endDate) ? ((permit.expiryAt || permit.endDate) | date:'dd MMM yyyy, HH:mm') : 'Not set' }}</td>
                      <td><a class="btn btn-ghost btn-sm" [routerLink]="['/supervisor/permit', permit.id]">Open</a></td>
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
export class TeamPermitsComponent implements OnInit {
  private permitService = inject(PermitService);

  loading = signal(true);
  permits = signal<WorkPermit[]>([]);
  filteredPermits = signal<WorkPermit[]>([]);
  searchTerm = '';

  ngOnInit(): void {
    this.permitService.getPermits({ page: 0, size: 200 }).subscribe({
      next: response => {
        this.permits.set(response.content);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();
    this.filteredPermits.set(this.permits().filter(permit => !search || [
      permit.permitNumber,
      permit.title,
      permit.requestedByName
    ].some(value => (value ?? '').toLowerCase().includes(search))));
  }
}
