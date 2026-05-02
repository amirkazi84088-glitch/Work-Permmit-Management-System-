import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Organization, Department, ApiResponse, PagedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly API = `${environment.apiUrl}/organizations`;

  constructor(private http: HttpClient) {}

  getOrganizations(page = 0, size = 20, search = ''): Observable<PagedResponse<Organization>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<PagedResponse<Organization>>>(this.API, { params })
      .pipe(map(r => ({
        ...r.data,
        content: (r.data?.content ?? []).map(org => this.normalizeOrganization(org))
      })));
  }

  getOrganization(id: number): Observable<Organization> {
    return this.http.get<ApiResponse<Organization>>(`${this.API}/${id}`)
      .pipe(map(r => this.normalizeOrganization(r.data)));
  }

  createOrganization(req: Partial<Organization>): Observable<Organization> {
    return this.http.post<ApiResponse<Organization>>(this.API, req)
      .pipe(map(r => this.normalizeOrganization(r.data)));
  }

  updateOrganization(id: number, req: Partial<Organization>): Observable<Organization> {
    return this.http.put<ApiResponse<Organization>>(`${this.API}/${id}`, req)
      .pipe(map(r => this.normalizeOrganization(r.data)));
  }

  toggleOrganizationStatus(id: number): Observable<Organization> {
    return this.http.patch<ApiResponse<Organization>>(`${this.API}/${id}/toggle-status`, {})
      .pipe(map(r => this.normalizeOrganization(r.data)));
  }

  getDepartments(orgId: number): Observable<Department[]> {
    return this.http.get<ApiResponse<Department[]>>(`${this.API}/${orgId}/departments`)
      .pipe(map(r => r.data));
  }

  createDepartment(orgId: number, dept: Partial<Department>): Observable<Department> {
    return this.http.post<ApiResponse<Department>>(`${this.API}/${orgId}/departments`, dept)
      .pipe(map(r => r.data));
  }

  updateDepartment(orgId: number, deptId: number, dept: Partial<Department>): Observable<Department> {
    return this.http.put<ApiResponse<Department>>(`${this.API}/${orgId}/departments/${deptId}`, dept)
      .pipe(map(r => r.data));
  }

  deleteDepartment(orgId: number, deptId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${orgId}/departments/${deptId}`)
      .pipe(map(() => undefined));
  }

  private normalizeOrganization(raw: any): Organization {
    return {
      ...raw,
      status: String(raw.status ?? 'ACTIVE') as any,
      createdAt: raw.createdAt ?? new Date().toISOString()
    };
  }
}
