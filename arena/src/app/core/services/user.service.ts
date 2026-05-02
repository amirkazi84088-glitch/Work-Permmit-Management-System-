import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, CreateUserRequest, PagedResponse, ApiResponse, UserFilter } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(filter: UserFilter = {}): Observable<PagedResponse<User>> {
    const params = this.buildParams(filter);
    return this.http.get<ApiResponse<User[]> | User[]>(this.API, { params })
      .pipe(map(r => this.toPaged(this.extractData(r), filter)));
  }

  getUser(id: number): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.API}/${id}`)
      .pipe(map(r => r.data));
  }

  createUser(req: CreateUserRequest): Observable<User> {
    return this.http.post<ApiResponse<User> | User>(this.API, {
      name: [req.firstName, req.lastName].filter(Boolean).join(' ').trim(),
      email: req.email,
      password: req.password || 'Test@1234',
      role: req.role
    }).pipe(map(r => this.normalizeUser(this.extractData(r))));
  }

  updateUser(id: number, req: Partial<CreateUserRequest>): Observable<User> {
    return this.http.put<ApiResponse<User> | User>(`${this.API}/${id}`, {
      firstName: req.firstName,
      lastName: req.lastName,
      email: req.email,
      phone: req.phone,
      employeeId: req.employeeId,
      role: req.role,
      organizationId: req.organizationId,
      departmentId: req.departmentId,
      isActive: req.isActive
    }).pipe(map(r => this.normalizeUser(this.extractData(r))));
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${id}`)
      .pipe(map(() => undefined));
  }

  toggleUserStatus(id: number): Observable<User> {
    return this.http.put<ApiResponse<User> | User>(`${this.API}/${id}/toggle-status`, {})
      .pipe(map(r => this.normalizeUser(this.extractData(r))));
  }

  resetUserPassword(id: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/${id}/reset-password`, {});
  }

  getUsersByRole(role: string, organizationId?: number): Observable<User[]> {
    let params = new HttpParams().set('role', role);
    if (organizationId) params = params.set('organizationId', organizationId);
    return this.http.get<ApiResponse<User[]>>(`${this.API}/by-role`, { params })
      .pipe(map(r => r.data));
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

  private toPaged(users: User[], filter: UserFilter): PagedResponse<User> {
    const normalized = (users ?? []).map(user => this.normalizeUser(user));
    const search = (filter.search ?? '').trim().toLowerCase();

    const filtered = normalized.filter(user => {
      const matchesRole = !filter.role || user.role === filter.role;
      const matchesActive = filter.isActive === undefined || user.isActive === filter.isActive;
      const matchesSearch = !search || [
        user.firstName,
        user.lastName,
        user.email
      ].some(value => (value ?? '').toLowerCase().includes(search));
      return matchesRole && matchesActive && matchesSearch;
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

  private normalizeUser(raw: any): User {
    const nameParts = String(raw.name ?? '').trim().split(/\s+/).filter(Boolean);
    return {
      ...raw,
      id: raw.id ?? 0,
      firstName: raw.firstName ?? nameParts[0] ?? 'User',
      lastName: raw.lastName ?? nameParts.slice(1).join(' '),
      email: raw.email ?? '',
      role: raw.role ?? raw.roles?.[0] ?? 'WORKER',
      isActive: raw.isActive ?? raw.active ?? true,
      createdAt: raw.createdAt ?? new Date().toISOString()
    };
  }
}
