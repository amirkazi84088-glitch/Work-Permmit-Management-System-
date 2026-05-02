import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardStats, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly API = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getStats(organizationId?: number): Observable<DashboardStats> {
    let params = new HttpParams();
    if (organizationId) params = params.set('organizationId', organizationId);
    return this.http.get<ApiResponse<DashboardStats> | DashboardStats | Record<string, unknown>>(`${this.API}/stats`, { params })
      .pipe(map(r => this.normalizeStats(this.extractData(r) as DashboardStats | Record<string, unknown>)));
  }

  getAdminStats(organizationId: number): Observable<DashboardStats> {
    return this.getStats(organizationId);
  }

  getSuperAdminStats(): Observable<DashboardStats> {
    return this.getStats();
  }

  private extractData<T>(response: ApiResponse<T> | T): T {
    return (response as ApiResponse<T>).data !== undefined
      ? (response as ApiResponse<T>).data
      : (response as T);
  }

  private normalizeStats(raw: DashboardStats | Record<string, unknown>): DashboardStats {
    if (this.isDashboardStats(raw)) {
      return raw;
    }

    const cards = Array.isArray(raw['cards']) ? raw['cards'] as Array<{ title?: string; value?: number }> : [];
    const getValue = (title: string): number => Number(cards.find(card => card.title === title)?.value ?? 0);

    return {
      totalPermits: getValue('My Permits') || getValue('Total Permits'),
      pendingPermits: getValue('Submitted Permits') || getValue('Draft Permits'),
      activePermits: getValue('Active Permits'),
      approvedToday: getValue('My Approvals'),
      rejectedTotal: 0,
      expiringSoon: getValue('Expired Permits') || getValue('Unread Notifications'),
      complianceRate: 0,
      permitsByType: {},
      permitsByStatus: {},
      recentActivity: [],
      role: String(raw['role'] ?? ''),
      cards: cards.map(card => ({
        title: String(card.title ?? ''),
        value: Number(card.value ?? 0)
      }))
    };
  }

  private isDashboardStats(raw: DashboardStats | Record<string, unknown>): raw is DashboardStats {
    return ['totalPermits', 'pendingPermits', 'activePermits', 'approvedToday'].every(
      key => typeof (raw as Record<string, unknown>)[key] === 'number'
    );
  }
}
