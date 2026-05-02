import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-permit-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (type === 'status') {
      <span class="badge" [class]="'badge-' + getStatusClass(value)">
        <span class="dot"></span>{{ getStatusLabel(value) }}
      </span>
    }
    @if (type === 'risk') {
      <span class="badge" [class]="'badge-' + getRiskClass(value)">
        {{ getRiskLabel(value) }}
      </span>
    }
    @if (type === 'permit-type') {
      <span class="badge badge-active">{{ getTypeLabel(value) }}</span>
    }
  `
})
export class PermitStatusBadgeComponent {
  @Input() type: 'status' | 'risk' | 'permit-type' = 'status';
  @Input() value = '';

  getStatusClass(s: string): string {
    const map: Record<string, string> = {
      DRAFT: 'draft',
      SUBMITTED: 'pending',
      PENDING_SUPERVISOR: 'pending',
      PENDING_SAFETY_OFFICER: 'pending',
      APPROVED: 'approved',
      ACTIVE: 'active',
      CLOSED: 'closed',
      REJECTED: 'rejected',
      CANCELLED: 'closed',
      EXPIRED: 'expired',
      CLOSURE_REQUESTED: 'pending'
    };
    return map[s] ?? 'draft';
  }

  getStatusLabel(s: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Draft',
      SUBMITTED: 'Submitted',
      PENDING_SUPERVISOR: 'Pending Supervisor',
      PENDING_SAFETY_OFFICER: 'Pending Safety Officer',
      APPROVED: 'Approved',
      ACTIVE: 'Active',
      CLOSED: 'Closed',
      REJECTED: 'Rejected',
      CANCELLED: 'Cancelled',
      EXPIRED: 'Expired',
      CLOSURE_REQUESTED: 'Closure Requested'
    };
    return map[s] ?? s;
  }

  getRiskClass(r: string): string {
    const map: Record<string, string> = {
      LOW: 'approved',
      MEDIUM: 'pending',
      HIGH: 'rejected',
      CRITICAL: 'rejected'
    };
    return map[r] ?? 'draft';
  }

  getRiskLabel(r: string): string {
    if (!r) {
      return 'Unknown';
    }
    return r.charAt(0) + r.slice(1).toLowerCase();
  }

  getTypeLabel(t: string): string {
    const map: Record<string, string> = {
      HOT_WORK: 'Hot Work',
      CONFINED_SPACE: 'Confined Space',
      ELECTRICAL: 'Electrical',
      WORKING_AT_HEIGHT: 'Height Work',
      EXCAVATION: 'Excavation',
      CHEMICAL_HANDLING: 'Chemical',
      COLD_WORK: 'Cold Work',
      GENERAL: 'General'
    };
    return map[t] ?? t.replace(/_/g, ' ');
  }
}
