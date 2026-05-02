import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map, catchError, throwError, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User, UserRole, LoginRequest, LoginResponse, BackendLoginTokenResponse,
  ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest, ApiResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;
  private readonly ME_API = `${this.API}/me`;

  // Signals for reactive auth state
  private _user = signal<User | null>(this.loadUser());
  private _token = signal<string | null>(localStorage.getItem(environment.tokenKey));

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token() && !!this._user());
  readonly currentRole = computed(() => this._user()?.role ?? null);
  readonly isWorker = computed(() => this._user()?.role === 'WORKER');
  readonly isSupervisor = computed(() => this._user()?.role === 'SUPERVISOR');
  readonly isSafetyOfficer = computed(() => this._user()?.role === 'SAFETY_OFFICER');
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');
  readonly isSuperAdmin = computed(() => this._user()?.role === 'SUPER_ADMIN');

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<BackendLoginTokenResponse>(`${this.API}/login`, credentials).pipe(
      tap(res => this.setTokenOnlySession(res.token)),
      switchMap(tokenRes =>
        this.getProfile().pipe(
          map(user => ({
            token: tokenRes.token,
            tokenType: tokenRes.tokenType,
            user
          }))
        )
      ),
      catchError(err => throwError(() => err))
    );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<LoginResponse> {
    this.clearSession();
    return throwError(() => new Error('Refresh token is not supported by the backend'));
  }

  forgotPassword(req: ForgotPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/forgot-password`, req);
  }

  resetPassword(req: ResetPasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/reset-password`, req);
  }

  changePassword(req: ChangePasswordRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/change-password`, req);
  }

  getProfile(): Observable<User> {
    return this.http.get<ApiResponse<User> | User>(this.ME_API).pipe(
      map(res => this.extractUser(res)),
      tap(user => {
        this._user.set(user);
        localStorage.setItem(environment.userKey, JSON.stringify(user));
      })
    );
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.put<ApiResponse<User> | User>(`${this.API}/profile`, data).pipe(
      map(res => this.extractUser(res)),
      tap(user => {
        this._user.set(user);
        localStorage.setItem(environment.userKey, JSON.stringify(user));
      })
    );
  }

  hasRole(...roles: UserRole[]): boolean {
    return roles.includes(this._user()?.role as UserRole);
  }

  hasAnyRole(...roles: UserRole[]): boolean {
    return this.hasRole(...roles);
  }

  getDashboardRoute(): string {
    const role = this._user()?.role;
    const routes: Record<UserRole, string> = {
      WORKER: '/worker/dashboard',
      SUPERVISOR: '/supervisor/dashboard',
      SAFETY_OFFICER: '/safety-officer/dashboard',
      ADMIN: '/admin/dashboard',
      PERMIT_APPROVER: '/supervisor/dashboard',
      SUPER_ADMIN: '/super-admin/dashboard'
    };
    return routes[role as UserRole] ?? '/auth/login';
  }

  private setSession(data: LoginResponse): void {
    localStorage.setItem(environment.tokenKey, data.token);
    if (data.refreshToken) {
      localStorage.setItem(environment.refreshTokenKey, data.refreshToken);
    }
    localStorage.setItem(environment.userKey, JSON.stringify(data.user));
    this._token.set(data.token);
    this._user.set(data.user);
  }

  private setTokenOnlySession(token: string): void {
    localStorage.setItem(environment.tokenKey, token);
    this._token.set(token);
  }

  private clearSession(): void {
    localStorage.removeItem(environment.tokenKey);
    localStorage.removeItem(environment.refreshTokenKey);
    localStorage.removeItem(environment.userKey);
    this._token.set(null);
    this._user.set(null);
  }

  clearAuthState(): void {
    this.clearSession();
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(environment.userKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private extractUser(response: ApiResponse<User> | User): User {
    const rawUser = ('data' in response ? response.data : response) as any;
    const role =
      rawUser.role ||
      (Array.isArray(rawUser.roles) ? rawUser.roles[0] : undefined) ||
      (Array.isArray(rawUser.authorities) ? rawUser.authorities[0]?.authority ?? rawUser.authorities[0] : undefined);
    const firstName = rawUser.firstName ?? rawUser.firstname ?? rawUser.givenName ?? this.splitName(rawUser.fullName ?? rawUser.name).firstName;
    const lastName = rawUser.lastName ?? rawUser.lastname ?? rawUser.familyName ?? this.splitName(rawUser.fullName ?? rawUser.name).lastName;

    return {
      ...rawUser,
      id: rawUser.id ?? rawUser.userId ?? 0,
      firstName: firstName || 'User',
      lastName: lastName || '',
      email: rawUser.email ?? rawUser.username ?? '',
      organizationName: rawUser.organizationName ?? rawUser.organization?.name ?? rawUser.companyName,
      departmentName: rawUser.departmentName ?? rawUser.department?.name,
      employeeId: rawUser.employeeId ?? rawUser.employeeCode ?? rawUser.empId,
      isActive: this.normalizeActive(rawUser),
      createdAt: rawUser.createdAt ?? rawUser.createdDate ?? new Date().toISOString(),
      role: this.normalizeRole(role)
    };
  }

  private normalizeRole(role: string | undefined): UserRole {
    const normalized = (role ?? 'WORKER').replace(/^ROLE_/, '').toUpperCase();
    const roleMap: Record<string, UserRole> = {
      WORKER: 'WORKER',
      SUPERVISOR: 'SUPERVISOR',
      SAFETY_OFFICER: 'SAFETY_OFFICER',
      ADMIN: 'ADMIN',
      PERMIT_APPROVER: 'PERMIT_APPROVER',
      SUPER_ADMIN: 'SUPER_ADMIN'
    };
    return roleMap[normalized] ?? 'WORKER';
  }

  private splitName(value: string | undefined): { firstName: string; lastName: string } {
    const parts = (value ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return { firstName: '', lastName: '' };
    }
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    };
  }

  private normalizeActive(rawUser: any): boolean {
    const value = rawUser.isActive ?? rawUser.active ?? rawUser.enabled ?? rawUser.accountStatus ?? rawUser.status;
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toUpperCase();
      if (['ACTIVE', 'ENABLED', 'TRUE'].includes(normalized)) {
        return true;
      }
      if (['INACTIVE', 'DISABLED', 'FALSE', 'LOCKED'].includes(normalized)) {
        return false;
      }
    }
    return true;
  }
}
