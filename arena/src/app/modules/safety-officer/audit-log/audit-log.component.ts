import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuditLogEntry } from '../../../core/models';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrapper">
      <div class="page-header">
        <div class="page-title-section">
          <h2>Audit Log</h2>
          <p>Review permit and inspection events for accountability and tracing.</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>Audit Trail</h3></div>
        <div class="card-body" style="padding-bottom:0;">
          <div class="filter-bar">
            <div class="form-group" style="margin:0;">
              <label class="form-label">Start Date</label>
              <input class="form-control" type="date" [(ngModel)]="startDate" />
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label">End Date</label>
              <input class="form-control" type="date" [(ngModel)]="endDate" />
            </div>
            <button class="btn btn-primary" (click)="loadLogs()">Apply</button>
          </div>
        </div>
        <div class="card-body" style="padding:0;">
          @if (loading()) {
            <div class="empty-state"><p>Loading audit activity...</p></div>
          } @else {
            <div class="table-wrapper" style="border:none;">
              <table class="table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>User</th>
                    <th>Module</th>
                    <th>Action</th>
                    <th>Entity</th>
                  </tr>
                </thead>
                <tbody>
                  @for (log of logs(); track log.id) {
                    <tr>
                      <td>{{ log.loggedAt | date:'dd MMM yyyy, HH:mm' }}</td>
                      <td>{{ log.userEmail || 'System' }}</td>
                      <td>{{ log.module }}</td>
                      <td>{{ log.action }}</td>
                      <td>{{ log.entityId || '—' }}</td>
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
export class AuditLogComponent implements OnInit {
  private http = inject(HttpClient);

  logs = signal<AuditLogEntry[]>([]);
  loading = signal(true);
  startDate = '';
  endDate = '';

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    let params = new HttpParams();
    if (this.startDate) params = params.set('startDate', this.startDate);
    if (this.endDate) params = params.set('endDate', this.endDate);

    this.http.get<AuditLogEntry[]>(`${environment.apiUrl}/audit-logs`, { params }).subscribe({
      next: logs => {
        this.logs.set(logs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
