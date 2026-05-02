import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  WorkPermit, CreatePermitRequest, ApprovalRequest, ClosePermitRequest,
  PagedResponse, ApiResponse, PermitFilter, Inspection, PermitTypeOption
} from '../models';

@Injectable({ providedIn: 'root' })
export class PermitService {
  private readonly API = `${environment.apiUrl}/permits`;
  private readonly APPROVALS_API = `${environment.apiUrl}/approvals`;
  private readonly REPORTS_API = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getPermits(filter: PermitFilter = {}): Observable<PagedResponse<WorkPermit>> {
    const params = this.buildParams(filter);
    return this.http.get<ApiResponse<WorkPermit[]> | WorkPermit[]>(this.API, { params })
      .pipe(map(r => this.toPaged(this.extractData(r), filter)));
  }

  getPermit(id: number): Observable<WorkPermit> {
    return this.http.get<ApiResponse<WorkPermit> | WorkPermit>(`${this.API}/${id}`)
      .pipe(map(r => this.normalizePermit(this.extractData(r))));
  }

  getPermitTypes(): Observable<PermitTypeOption[]> {
    return this.http.get<ApiResponse<PermitTypeOption[]> | PermitTypeOption[]>(`${environment.apiUrl}/permit-types`)
      .pipe(map(r => (this.extractData(r) ?? []).map(type => ({
        ...type,
        isActive: type.isActive ?? true
      }))));
  }

  createPermit(req: Partial<CreatePermitRequest> & Record<string, unknown>): Observable<WorkPermit> {
    return this.http.post<ApiResponse<WorkPermit> | WorkPermit>(this.API, req)
      .pipe(map(r => this.normalizePermit(this.extractData(r))));
  }

  updatePermit(id: number, req: Partial<CreatePermitRequest>): Observable<WorkPermit> {
    return this.http.put<ApiResponse<WorkPermit> | WorkPermit>(`${this.API}/${id}`, req)
      .pipe(map(r => this.normalizePermit(this.extractData(r))));
  }

  submitPermit(id: number): Observable<WorkPermit> {
    return this.http.put<ApiResponse<WorkPermit> | WorkPermit>(`${this.API}/${id}/submit`, {})
      .pipe(map(r => this.normalizePermit(this.extractData(r))));
  }

  approvePermit(req: ApprovalRequest): Observable<WorkPermit> {
    return this.decidePermit(req.permitId, true, req.comment);
  }

  rejectPermit(req: ApprovalRequest): Observable<WorkPermit> {
    return this.decidePermit(req.permitId, false, req.comment);
  }

  closePermit(req: ClosePermitRequest): Observable<WorkPermit> {
    return this.http.put<ApiResponse<WorkPermit> | WorkPermit>(
      `${this.API}/${req.permitId}/close`,
      {}
    ).pipe(map(r => this.normalizePermit(this.extractData(r))));
  }

  cancelPermit(id: number, reason: string): Observable<WorkPermit> {
    return this.http.put<ApiResponse<WorkPermit> | WorkPermit>(
      `${this.API}/${id}/cancel`,
      {}
    ).pipe(map(r => this.normalizePermit(this.extractData(r))));
  }

  deletePermit(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${id}`)
      .pipe(map(() => undefined));
  }

  getMyPermits(filter: PermitFilter = {}): Observable<PagedResponse<WorkPermit>> {
    return this.http.get<ApiResponse<WorkPermit[]> | WorkPermit[]>(`${this.API}/my`)
      .pipe(map(r => this.toPaged(this.extractData(r), filter)));
  }

  getPendingApprovals(filter: PermitFilter = {}): Observable<PagedResponse<WorkPermit>> {
    return this.http.get<ApiResponse<WorkPermit[]> | WorkPermit[]>(`${this.APPROVALS_API}/queue`)
      .pipe(map(r => this.toPaged(this.extractData(r), filter)));
  }

  addInspection(permitId: number, inspection: Partial<Inspection>): Observable<Inspection> {
    return this.http.post<ApiResponse<Inspection>>(
      `${this.API}/${permitId}/inspections`, inspection
    ).pipe(map(r => r.data));
  }

  uploadAttachment(permitId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<any>>(
      `${this.API}/${permitId}/attachments`, formData
    ).pipe(map(r => r.data));
  }

  exportPermits(filter: PermitFilter = {}, format: 'PDF' | 'EXCEL' = 'PDF'): Observable<Blob> {
    const params = this.buildParams({ ...filter, format });
    return this.http.get(`${this.API}/export`, { params, responseType: 'blob' });
  }

  getPermitTrend(startDate: string, endDate: string): Observable<Array<{ date: string; count: number }>> {
    const params = this.buildParams({ startDate, endDate });
    return this.http.get<Array<{ date: string; count: number }>>(`${this.REPORTS_API}/permits`, { params });
  }

  getPermitTypeDistribution(): Observable<Array<{ permitTypeId: number; name: string; description?: string; checklistCount: number; permitCount: number }>> {
    return this.http.get<Array<{ permitTypeId: number; name: string; description?: string; checklistCount: number; permitCount: number }>>(`${this.REPORTS_API}/types`);
  }

  private buildParams(filter: Record<string, any>): HttpParams {
    let params = new HttpParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return params;
  }

  private extractData<T>(response: ApiResponse<T> | T): T {
    return (response as ApiResponse<T>).data !== undefined
      ? (response as ApiResponse<T>).data
      : (response as T);
  }

  private decidePermit(permitId: number, approved: boolean, comments?: string): Observable<WorkPermit> {
    return this.http.post<ApiResponse<WorkPermit> | WorkPermit>(
      `${this.APPROVALS_API}/${permitId}/decision`,
      { approved, comments }
    ).pipe(map(r => this.normalizePermit(this.extractData(r))));
  }

  private toPaged(response: WorkPermit[], filter: PermitFilter): PagedResponse<WorkPermit> {
    const normalized = (response ?? []).map(permit => this.normalizePermit(permit));
    const search = (filter.search ?? '').trim().toLowerCase();
    const status = filter.status;
    const permitType = filter.permitType;

    const filtered = normalized.filter(permit => {
      const matchesSearch = !search || [
        permit.permitNumber,
        permit.title,
        permit.description,
        permit.permitTypeName,
        permit.location
      ].some(value => (value ?? '').toLowerCase().includes(search));
      const matchesStatus = !status || permit.status === status;
      const matchesType = !permitType || permit.permitType === permitType || permit.permitTypeName === permitType;
      return matchesSearch && matchesStatus && matchesType;
    });

    const page = Number(filter.page ?? 0);
    const size = Number(filter.size ?? (filtered.length || 10));
    const start = page * size;
    const content = filtered.slice(start, start + size);
    const totalElements = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));

    return {
      content,
      totalElements,
      totalPages,
      currentPage: page,
      pageSize: size,
      first: page === 0,
      last: page >= totalPages - 1
    };
  }

  private normalizePermit(raw: any): WorkPermit {
    const permitTypeName = raw.permitTypeName ?? raw.permitType ?? 'GENERAL';
    const expiryAt = raw.expiryAt ?? raw.expiryDate ?? raw.endDate ?? null;
    return {
      ...raw,
      permitType: this.normalizePermitType(permitTypeName),
      permitTypeName,
      requestedById: raw.requestedById ?? raw.requesterId ?? 0,
      requestedByName: raw.requestedByName ?? raw.requesterName ?? 'Unknown',
      organizationId: raw.organizationId ?? 0,
      riskLevel: raw.riskLevel ?? 'MEDIUM',
      location: raw.location ?? '',
      startDate: raw.startDate ?? raw.submittedAt ?? raw.createdAt ?? null,
      endDate: raw.endDate ?? expiryAt,
      createdAt: raw.createdAt ?? raw.submittedAt ?? new Date().toISOString(),
      submittedAt: raw.submittedAt ?? null,
      expiryAt,
      status: raw.status
    };
  }

  private normalizePermitType(value: string): string {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    const map: Record<string, string> = {
      HOT_WORK: 'HOT_WORK',
      COLD_WORK: 'COLD_WORK',
      CONFINED_SPACE: 'CONFINED_SPACE',
      HEIGHT_WORK: 'WORKING_AT_HEIGHT',
      WORKING_AT_HEIGHT: 'WORKING_AT_HEIGHT',
      ELECTRICAL: 'ELECTRICAL',
      CHEMICAL: 'CHEMICAL_HANDLING',
      CHEMICAL_HANDLING: 'CHEMICAL_HANDLING'
    };
    return map[normalized] ?? normalized;
  }
}
