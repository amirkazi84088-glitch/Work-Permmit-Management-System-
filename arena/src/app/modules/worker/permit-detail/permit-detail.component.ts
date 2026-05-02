import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PermitService } from '../../../core/services/permit.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { PermitStatusBadgeComponent } from '../../../shared/components/permit-status-badge/permit-status-badge.component';
import { WorkPermit } from '../../../core/models';

@Component({
  selector: 'app-permit-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PermitStatusBadgeComponent],
  template: `
    <div class="page-wrapper">
      @if (loading()) {
        <div class="empty-state"><p>Loading permit details...</p></div>
      } @else if (!permit()) {
        <div class="empty-state">
          <h3>Permit not found</h3>
          <p>The permit does not exist or is not accessible for this user.</p>
        </div>
      } @else {
        <div class="breadcrumb">
          <a href="#" onclick="history.back(); return false;">Back</a>
          <span class="bc-separator">›</span>
          <span class="bc-current">{{ permit()!.permitNumber }}</span>
        </div>

        <div class="page-header">
          <div class="page-title-section">
            <h2>{{ permit()!.title }}</h2>
            <p>{{ permit()!.permitNumber }} · Requested by {{ permit()!.requestedByName }}</p>
          </div>
          <div class="page-actions" style="display:flex; gap:8px; flex-wrap:wrap;">
            <app-permit-status-badge type="status" [value]="permit()!.status"></app-permit-status-badge>
            @if (canApprove()) {
              <button class="btn btn-success" (click)="openApprovalModal('APPROVE')">Approve</button>
              <button class="btn btn-danger" (click)="openApprovalModal('REJECT')">Reject</button>
            }
            @if (canClose()) {
              <button class="btn btn-secondary" (click)="closePermit()" [disabled]="approvalLoading()">Close Permit</button>
            }
          </div>
        </div>

        <div class="grid grid-2" style="display:grid; grid-template-columns: 1fr 340px; gap:24px; align-items:start;">
          <div class="card">
            <div class="card-header"><h3>Permit Details</h3></div>
            <div class="card-body">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Permit Type</span>
                  <app-permit-status-badge type="permit-type" [value]="permit()!.permitType"></app-permit-status-badge>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Status</span>
                  <app-permit-status-badge type="status" [value]="permit()!.status"></app-permit-status-badge>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Requested By</span>
                  <span>{{ permit()!.requestedByName }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Submitted At</span>
                  <span>{{ permit()!.submittedAt ? (permit()!.submittedAt | date:'dd MMM yyyy, HH:mm') : '—' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Expires At</span>
                  <span>{{ permit()!.expiryAt ? (permit()!.expiryAt | date:'dd MMM yyyy, HH:mm') : '—' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Location</span>
                  <span>{{ permit()!.location || '—' }}</span>
                </div>
              </div>

              <div style="margin-top:16px;">
                <span class="detail-label">Description</span>
                <p style="margin-top:6px;">{{ permit()!.description || 'No description provided.' }}</p>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3>Meta</h3></div>
            <div class="card-body">
              <div class="detail-item">
                <span class="detail-label">Permit ID</span>
                <span>{{ permit()!.id }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Requester ID</span>
                <span>{{ permit()!.requestedById }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Created</span>
                <span>{{ permit()!.createdAt | date:'dd MMM yyyy, HH:mm' }}</span>
              </div>
            </div>
          </div>
        </div>

        @if (showApprovalModal()) {
          <div class="modal-backdrop">
            <div class="modal modal-md">
              <div class="modal-header">
                <h3>{{ approvalAction() === 'APPROVE' ? 'Approve Permit' : 'Reject Permit' }}</h3>
                <button class="btn btn-ghost btn-sm" (click)="showApprovalModal.set(false)">x</button>
              </div>
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">Comment</label>
                  <textarea class="form-control" [(ngModel)]="approvalComment" rows="4"></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-secondary" (click)="showApprovalModal.set(false)">Cancel</button>
                <button class="btn" [class]="approvalAction() === 'APPROVE' ? 'btn-success' : 'btn-danger'" [disabled]="approvalLoading()" (click)="submitApproval()">
                  {{ approvalAction() === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection' }}
                </button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .detail-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .detail-item { display:flex; flex-direction:column; gap:4px; margin-bottom:12px; }
    .detail-label { font-size:0.75rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; }
  `]
})
export class PermitDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private permitService = inject(PermitService);
  public authService = inject(AuthService);
  private toastService = inject(ToastService);

  permit = signal<WorkPermit | null>(null);
  loading = signal(true);
  showApprovalModal = signal(false);
  approvalAction = signal<'APPROVE' | 'REJECT'>('APPROVE');
  approvalComment = '';
  approvalLoading = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.permitService.getPermit(id).subscribe({
      next: (permit) => {
        this.permit.set(permit);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  canApprove(): boolean {
    const role = this.authService.user()?.role;
    const status = this.permit()?.status;
    if (role === 'SUPERVISOR' || role === 'PERMIT_APPROVER') {
      return status === 'PENDING_SUPERVISOR';
    }
    if (role === 'SAFETY_OFFICER') {
      return status === 'PENDING_SAFETY_OFFICER';
    }
    return false;
  }

  canClose(): boolean {
    const role = this.authService.user()?.role;
    return ['SUPERVISOR', 'ADMIN', 'SUPER_ADMIN'].includes(role ?? '') &&
      this.permit()?.status === 'CLOSURE_REQUESTED';
  }

  openApprovalModal(action: 'APPROVE' | 'REJECT'): void {
    this.approvalAction.set(action);
    this.approvalComment = '';
    this.showApprovalModal.set(true);
  }

  submitApproval(): void {
    const permitId = this.permit()?.id;
    if (!permitId) {
      return;
    }

    this.approvalLoading.set(true);
    const request = {
      permitId,
      action: this.approvalAction(),
      comment: this.approvalComment
    };

    const action$ = this.approvalAction() === 'APPROVE'
      ? this.permitService.approvePermit(request)
      : this.permitService.rejectPermit(request);

    action$.subscribe({
      next: (updated) => {
        this.permit.set(updated);
        this.approvalLoading.set(false);
        this.showApprovalModal.set(false);
        this.toastService.success('Permit updated', `${updated.permitNumber} has been updated`);
      },
      error: (err) => {
        this.approvalLoading.set(false);
        this.toastService.error('Action failed', err?.error?.message || 'Please try again');
      }
    });
  }

  closePermit(): void {
    const permitId = this.permit()?.id;
    if (!permitId) {
      return;
    }

    this.approvalLoading.set(true);
    this.permitService.closePermit({ permitId, closingRemarks: '' }).subscribe({
      next: (updated) => {
        this.permit.set(updated);
        this.approvalLoading.set(false);
        this.toastService.success('Permit closed', `${updated.permitNumber} is now closed`);
      },
      error: (err) => {
        this.approvalLoading.set(false);
        this.toastService.error('Close failed', err?.error?.message || 'Please try again');
      }
    });
  }
}
