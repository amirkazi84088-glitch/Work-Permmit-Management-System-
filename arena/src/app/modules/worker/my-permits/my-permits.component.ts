import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PermitService } from '../../../core/services/permit.service';
import { PermitStatusBadgeComponent } from '../../../shared/components/permit-status-badge/permit-status-badge.component';
import { WorkPermit } from '../../../core/models';

@Component({
  selector: 'app-my-permits',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PermitStatusBadgeComponent],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>My Permits</h2>
          <p>All your work permit applications.</p>
        </div>
        <div class="page-actions">
          <a routerLink="/worker/apply-permit" class="btn btn-primary">New Application</a>
        </div>
      </div>

      <div class="filter-bar">
        <div class="search-wrapper">
          <span class="search-icon">⌕</span>
          <input type="text" class="form-control" placeholder="Search permits..." [(ngModel)]="searchTerm" (input)="onSearch()" />
        </div>
        <select class="form-control filter-select" [(ngModel)]="statusFilter" (change)="onFilter()">
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PENDING_SUPERVISOR">Pending Supervisor</option>
          <option value="PENDING_SAFETY_OFFICER">Pending Safety Officer</option>
          <option value="APPROVED">Approved</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select class="form-control filter-select" [(ngModel)]="typeFilter" (change)="onFilter()">
          <option value="">All Types</option>
          <option value="HOT_WORK">Hot Work</option>
          <option value="CONFINED_SPACE">Confined Space</option>
          <option value="ELECTRICAL">Electrical</option>
          <option value="WORKING_AT_HEIGHT">Working at Height</option>
          <option value="EXCAVATION">Excavation</option>
          <option value="CHEMICAL_HANDLING">Chemical Handling</option>
          <option value="COLD_WORK">Cold Work</option>
          <option value="GENERAL">General</option>
        </select>
      </div>

      <div class="card">
        @if (loading()) {
          <div style="padding: 60px; text-align: center; color: var(--text-muted);">
            <div style="font-size: 32px; margin-bottom: 12px;">…</div>
            Loading permits...
          </div>
        } @else if (permits().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">P</div>
            <h3>No permits found</h3>
            <p>{{ searchTerm || statusFilter ? 'Try adjusting your search filters.' : 'You have not applied for any permits yet.' }}</p>
            @if (!searchTerm && !statusFilter) {
              <a routerLink="/worker/apply-permit" class="btn btn-primary">Apply for Permit</a>
            }
          </div>
        } @else {
          <div class="table-wrapper" style="border: none;">
            <table class="table">
              <thead>
                <tr>
                  <th>Permit #</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (permit of permits(); track permit.id) {
                  <tr>
                    <td><strong style="color: var(--primary);">{{ permit.permitNumber }}</strong></td>
                    <td>
                      <div style="font-weight: 500; color: var(--text-primary);">{{ permit.title }}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">{{ permit.location }}</div>
                    </td>
                    <td><app-permit-status-badge type="permit-type" [value]="permit.permitType"></app-permit-status-badge></td>
                    <td><app-permit-status-badge type="risk" [value]="permit.riskLevel ?? 'MEDIUM'"></app-permit-status-badge></td>
                    <td><app-permit-status-badge type="status" [value]="permit.status"></app-permit-status-badge></td>
                    <td>{{ permit.startDate | date:'dd MMM yyyy' }}</td>
                    <td>{{ permit.endDate | date:'dd MMM yyyy' }}</td>
                    <td>
                      <div style="display: flex; gap: 4px;">
                        <a [routerLink]="['/worker/permit', permit.id]" class="btn btn-ghost btn-sm">View</a>
                        @if (permit.status === 'DRAFT') {
                          <button class="btn btn-danger btn-sm" (click)="cancelPermit(permit)">Cancel</button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="pagination">
            <span class="pagination-info">
              Showing {{ (currentPage() * pageSize) + 1 }}-{{ Math.min((currentPage() + 1) * pageSize, totalElements()) }} of {{ totalElements() }}
            </span>
            <div class="pagination-controls">
              <button class="page-btn" [disabled]="currentPage() === 0" (click)="goToPage(currentPage() - 1)">‹</button>
              @for (page of getPages(); track page) {
                <button class="page-btn" [class.active]="page === currentPage()" (click)="goToPage(page)">{{ page + 1 }}</button>
              }
              <button class="page-btn" [disabled]="currentPage() >= totalPages() - 1" (click)="goToPage(currentPage() + 1)">›</button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class MyPermitsComponent implements OnInit {
  private permitService = inject(PermitService);

  permits = signal<WorkPermit[]>([]);
  loading = signal(true);
  currentPage = signal(0);
  totalElements = signal(0);
  totalPages = signal(0);
  pageSize = 10;
  searchTerm = '';
  statusFilter = '';
  typeFilter = '';
  Math = Math;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.permitService.getMyPermits({
      page: this.currentPage(),
      size: this.pageSize,
      search: this.searchTerm,
      status: this.statusFilter as any,
      permitType: this.typeFilter as any
    }).subscribe({
      next: p => {
        this.permits.set(p.content);
        this.totalElements.set(p.totalElements);
        this.totalPages.set(p.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(): void { this.currentPage.set(0); this.load(); }
  onFilter(): void { this.currentPage.set(0); this.load(); }
  goToPage(page: number): void { this.currentPage.set(page); this.load(); }

  getPages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const start = Math.max(0, current - 2);
    const end = Math.min(total - 1, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  cancelPermit(permit: WorkPermit): void {
    if (!confirm(`Cancel permit ${permit.permitNumber}?`)) return;
    this.permitService.cancelPermit(permit.id, 'Cancelled by applicant').subscribe({
      next: () => this.load(),
      error: () => {}
    });
  }
}
