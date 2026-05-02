import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notification, ApiResponse, PagedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly API = `${environment.apiUrl}/notifications`;
  unreadCount = signal<number>(0);

  constructor(private http: HttpClient) {}

  getNotifications(page = 0, size = 20): Observable<PagedResponse<Notification>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<ApiResponse<PagedResponse<Notification>> | PagedResponse<Notification> | Notification[]>(this.API, { params })
      .pipe(map(r => this.toPaged(this.extractData(r) as PagedResponse<Notification> | Notification[], page, size)));
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<ApiResponse<number> | number | { unreadCount?: number }>(`${this.API}/unread-count`).pipe(
      map(r => {
        const data = this.extractData(r as ApiResponse<number | { unreadCount?: number }> | number | { unreadCount?: number });
        const count = typeof data === 'number' ? data : Number(data?.unreadCount ?? 0);
        this.unreadCount.set(count);
        return count;
      })
    );
  }

  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.API}/mark-all-read`, {})
      .pipe(map(() => { this.unreadCount.set(0); }));
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.API}/mark-all-read`, {})
      .pipe(map(() => this.unreadCount.set(0)));
  }

  deleteNotification(id: number): Observable<void> {
    return this.markAsRead(id);
  }

  private extractData<T>(response: ApiResponse<T> | T): T {
    return (response as ApiResponse<T>).data !== undefined
      ? (response as ApiResponse<T>).data
      : (response as T);
  }

  private toPaged(data: PagedResponse<Notification> | Notification[], page: number, size: number): PagedResponse<Notification> {
    if (!Array.isArray(data)) {
      return data;
    }

    const items = data;
    const normalized = (items ?? []).map(item => ({
      ...item,
      title: item.title || 'Notification',
      isRead: item.isRead ?? (item as any).readStatus ?? false
    }));
    const start = page * size;
    const content = normalized.slice(start, start + size);
    const totalElements = normalized.length;
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
}
