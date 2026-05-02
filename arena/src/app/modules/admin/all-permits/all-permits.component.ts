import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PermitService } from '../../../core/services/permit.service';
import { WorkPermit, PermitStatus } from '../../../core/models';
import { PermitStatusBadgeComponent } from '../../../shared/components/permit-status-badge/permit-status-badge.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-all-permits',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PermitStatusBadgeComponent],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>All Permits</h2>
          <p>Review permit requests, monitor workflow state, and export operational snapshots.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-secondary" (click)="exportCsv()">Export CSV</button>
        </div>
      </div>

      <div class="filter-bar">
        <div class="search-wrapper">
          <span class="search-icon">⌕</span>
          <input class="form-control" [(ngModel)]="searchTerm" (input)="applyFilters()" placeholder="Search permit number, title, requester..." />
        </div>
        <select class="form-control filter-select" [(ngModel)]="statusFilter" (change)="applyFilters()">
          <option value="">All Statuses</option>
          @for (status of statuses; track status) {
            <option [value]="status">{{ status }}</option>
          }
        </select>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>Permit Overview</h3>
          <span class="table-subtitle">{{ filteredPermits().length }} permits</span>
        </div>
        <div class="card-body" style="padding:0;">
          @if (loading()) {
            <div class="empty-state"><p>Loading permits...</p></div>
          } @else if (filteredPermits().length === 0) {
            <div class="empty-state"><p>No permits match the current filters.</p></div>
          } @else {
            <div class="table-wrapper" style="border:none;">
              <table class="table">
                <thead>
                  <tr>
                    <th>Permit</th>
                    <th>Requester</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Expiry</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (permit of pagedPermits(); track permit.id) {
                    <tr>
                      <td>
                        <div class="table-title">{{ permit.permitNumber }}</div>
                        <div class="table-subtitle">{{ permit.title }}</div>
                      </td>
                      <td>{{ permit.requestedByName }}</td>
                      <td><app-permit-status-badge type="permit-type" [value]="permit.permitType"></app-permit-status-badge></td>
                      <td><app-permit-status-badge type="status" [value]="permit.status"></app-permit-status-badge></td>
                      <td>{{ permit.submittedAt ? (permit.submittedAt | date:'dd MMM yyyy') : 'Draft' }}</td>
                      <td>{{ (permit.expiryAt || permit.endDate) ? ((permit.expiryAt || permit.endDate) | date:'dd MMM yyyy') : 'Not set' }}</td>
                      <td><a class="btn btn-ghost btn-sm" [routerLink]="['/admin/permit', permit.id]">Open</a></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <div class="pagination">
              <span class="pagination-info">
                Showing {{ (currentPage() * pageSize) + 1 }}-{{ endIndex() }} of {{ filteredPermits().length }}
              </span>
              <div class="pagination-controls">
                <button class="page-btn" [disabled]="currentPage() === 0" (click)="goToPage(currentPage() - 1)">‹</button>
                @for (page of pages(); track page) {
                  <button class="page-btn" [class.active]="page === currentPage()" (click)="goToPage(page)">{{ page + 1 }}</button>
                }
                <button class="page-btn" [disabled]="currentPage() >= totalPages() - 1" (click)="goToPage(currentPage() + 1)">›</button>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class AllPermitsComponent implements OnInit {
  private permitService = inject(PermitService);
  private toastService = inject(ToastService);

  loading = signal(true);
  permits = signal<WorkPermit[]>([]);
  filteredPermits = signal<WorkPermit[]>([]);
  currentPage = signal(0);
  pageSize = 12;
  searchTerm = '';
  statusFilter = '';
  statuses: PermitStatus[] = ['DRAFT', 'PENDING_SUPERVISOR', 'PENDING_SAFETY_OFFICER', 'ACTIVE', 'CLOSURE_REQUESTED', 'CLOSED', 'REJECTED', 'CANCELLED', 'EXPIRED'];

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
    const status = this.statusFilter;
    const filtered = this.permits().filter(permit => {
      const matchesStatus = !status || permit.status === status;
      const matchesSearch = !search || [
        permit.permitNumber,
        permit.title,
        permit.description,
        permit.requestedByName
      ].some(value => (value ?? '').toLowerCase().includes(search));
      return matchesStatus && matchesSearch;
    });

    this.filteredPermits.set(filtered);
    this.currentPage.set(0);
  }

  pagedPermits(): WorkPermit[] {
    const start = this.currentPage() * this.pageSize;
    return this.filteredPermits().slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredPermits().length / this.pageSize));
  }

  pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, index) => index).slice(0, 7);
  }

  endIndex(): number {
    return Math.min((this.currentPage() + 1) * this.pageSize, this.filteredPermits().length);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  exportCsv(): void {
    this.permitService.exportPermits({}, 'PDF').subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'permits-export.csv';
        anchor.click();
        URL.revokeObjectURL(url);
        this.toastService.success('Export ready', 'Permit report downloaded');
      },
      error: err => this.toastService.error('Export failed', err?.error?.message || 'Unable to export permits')
    });
  }
}
