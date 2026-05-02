import { Component, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="app-header">
      <div class="header-left">
        <button class="header-btn menu-btn" (click)="toggleSidebar.emit()" title="Toggle menu">
          ☰
        </button>
        <div class="breadcrumb-area">
          <span class="page-context">{{ getGreeting() }}, {{ authService.user()?.firstName }}</span>
        </div>
      </div>

      <div class="header-right">
        <!-- Search -->
        <div class="header-search">
          <span class="search-icon-h">🔍</span>
          <input type="text" placeholder="Search permits..." class="header-search-input" />
        </div>

        <!-- Notifications -->
        <div class="notif-wrapper">
          <button class="header-btn notif-btn" (click)="showNotifications.set(!showNotifications())" title="Notifications">
            🔔
            @if (notifService.unreadCount() > 0) {
              <span class="notif-badge">{{ notifService.unreadCount() > 99 ? '99+' : notifService.unreadCount() }}</span>
            }
          </button>

          @if (showNotifications()) {
            <div class="notif-dropdown">
              <div class="notif-header">
                <h4>Notifications</h4>
                <button class="btn-link" (click)="markAllRead()">Mark all read</button>
              </div>
              <div class="notif-body">
                @if (notifications().length === 0) {
                  <div class="notif-empty">
                    <span>🔔</span>
                    <p>No notifications</p>
                  </div>
                }
                @for (n of notifications(); track n.id) {
                  <div class="notif-item" [class.unread]="!n.isRead" (click)="markRead(n.id)">
                    <div class="notif-dot" [class.unread]="!n.isRead"></div>
                    <div class="notif-content">
                      <p class="notif-title">{{ n.title }}</p>
                      <p class="notif-msg">{{ n.message }}</p>
                      <span class="notif-time">{{ formatTime(n.createdAt) }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- User Menu -->
        <div class="user-menu-wrapper">
          <button class="user-menu-btn" (click)="showUserMenu.set(!showUserMenu())" title="User menu">
            <div class="avatar-sm">{{ getUserInitials() }}</div>
            <div class="user-info-h">
              <span class="user-name-h">{{ authService.user()?.firstName }}</span>
              <span class="user-role-h">{{ getRoleLabel() }}</span>
            </div>
            <span class="chevron">▾</span>
          </button>

          @if (showUserMenu()) {
            <div class="user-dropdown">
              <a [routerLink]="getProfileRoute()" class="dropdown-item" (click)="showUserMenu.set(false)">
                👤 My Profile
              </a>
              <a [routerLink]="getSettingsRoute()" class="dropdown-item" (click)="showUserMenu.set(false)">
                ⚙️ Settings
              </a>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item danger" (click)="authService.logout()">
                🚪 Logout
              </button>
            </div>
          }
        </div>
      </div>
    </header>

    @if (showNotifications() || showUserMenu()) {
      <div class="header-overlay" (click)="closeAll()"></div>
    }
  `,
  styles: [`
    .app-header {
      height: var(--header-height);
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      position: sticky;
      top: 0;
      z-index: 50;
      gap: 16px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: none;
      border: 1px solid var(--border);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: var(--text-secondary);
      transition: all 0.15s;
      position: relative;
      &:hover { background: var(--bg-tertiary); color: var(--text-primary); }
    }

    .page-context {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .header-search {
      position: relative;
      display: flex;
      align-items: center;

      @media (max-width: 600px) { display: none; }
    }

    .search-icon-h {
      position: absolute;
      left: 10px;
      font-size: 14px;
      color: var(--text-muted);
    }

    .header-search-input {
      padding: 8px 12px 8px 34px;
      font-size: 0.85rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      outline: none;
      width: 220px;
      background: var(--bg-secondary);
      &:focus { border-color: var(--primary); background: white; }
      &::placeholder { color: var(--text-muted); }
    }

    .notif-wrapper, .user-menu-wrapper { position: relative; }

    .notif-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: white;
      font-size: 0.6rem;
      font-weight: 700;
      min-width: 16px;
      height: 16px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 3px;
    }

    .notif-dropdown, .user-dropdown {
      position: absolute;
      right: 0;
      top: calc(100% + 8px);
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: var(--shadow-lg);
      z-index: 200;
      animation: slideUp 0.2s ease;
    }

    .notif-dropdown { width: 340px; }

    .notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      h4 { font-size: 0.9rem; font-weight: 600; }
    }

    .btn-link {
      background: none;
      border: none;
      color: var(--primary);
      font-size: 0.8rem;
      cursor: pointer;
      &:hover { text-decoration: underline; }
    }

    .notif-body { max-height: 300px; overflow-y: auto; }

    .notif-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      color: var(--text-muted);
      font-size: 0.85rem;
      gap: 8px;
      span { font-size: 28px; opacity: 0.4; }
    }

    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;
      &:last-child { border-bottom: none; }
      &:hover { background: var(--bg-secondary); }
      &.unread { background: #eff6ff; }
    }

    .notif-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: transparent;
      margin-top: 6px;
      flex-shrink: 0;
      &.unread { background: var(--primary); }
    }

    .notif-content { flex: 1; min-width: 0; }
    .notif-title { font-size: 0.825rem; font-weight: 600; color: var(--text-primary); }
    .notif-msg { font-size: 0.775rem; color: var(--text-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .notif-time { font-size: 0.7rem; color: var(--text-muted); margin-top: 4px; display: block; }

    .user-menu-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 12px;
      background: none;
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
      &:hover { background: var(--bg-secondary); }
    }

    .avatar-sm {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .user-info-h {
      display: flex;
      flex-direction: column;
      text-align: left;
      @media (max-width: 500px) { display: none; }
    }

    .user-name-h { font-size: 0.825rem; font-weight: 600; color: var(--text-primary); }
    .user-role-h { font-size: 0.7rem; color: var(--text-muted); }
    .chevron { font-size: 10px; color: var(--text-muted); }

    .user-dropdown { width: 200px; padding: 6px; }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: 8px;
      font-size: 0.875rem;
      color: var(--text-secondary);
      cursor: pointer;
      text-decoration: none;
      background: none;
      border: none;
      width: 100%;
      transition: all 0.15s;
      &:hover { background: var(--bg-tertiary); color: var(--text-primary); }
      &.danger { color: var(--danger); &:hover { background: var(--danger-light); } }
    }

    .dropdown-divider { height: 1px; background: var(--border); margin: 4px 0; }

    .header-overlay {
      position: fixed;
      inset: 0;
      z-index: 100;
    }
  `]
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  authService = inject(AuthService);
  notifService = inject(NotificationService);

  showNotifications = signal(false);
  showUserMenu = signal(false);
  notifications = signal<any[]>([]);

  ngOnInit(): void {
    this.notifService.getUnreadCount().subscribe();
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.notifService.getNotifications(0, 10).subscribe({
      next: (p) => this.notifications.set(p.content),
      error: () => {}
    });
  }

  markRead(id: number): void {
    this.notifService.markAsRead(id).subscribe(() => {
      this.notifications.update(list => list.map(n => n.id === id ? { ...n, isRead: true } : n));
    });
  }

  markAllRead(): void {
    this.notifService.markAllAsRead().subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
    });
  }

  closeAll(): void {
    this.showNotifications.set(false);
    this.showUserMenu.set(false);
  }

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  getUserInitials(): string {
    const u = this.authService.user();
    if (!u) return '?';
    return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
  }

  getRoleLabel(): string {
    const map: Record<string, string> = {
      WORKER: 'Worker', SUPERVISOR: 'Supervisor', PERMIT_APPROVER: 'Permit Approver',
      SAFETY_OFFICER: 'Safety Officer', ADMIN: 'Admin', SUPER_ADMIN: 'Super Admin'
    };
    return map[this.authService.user()?.role ?? ''] ?? '';
  }

  getProfileRoute(): string {
    const map: Record<string, string> = {
      WORKER: '/worker/profile', SUPERVISOR: '/supervisor/profile',
      PERMIT_APPROVER: '/supervisor/profile',
      SAFETY_OFFICER: '/safety-officer/profile', ADMIN: '/admin/profile', SUPER_ADMIN: '/super-admin/profile'
    };
    return map[this.authService.user()?.role ?? ''] ?? '/';
  }

  getSettingsRoute(): string {
    return this.getProfileRoute();
  }

  formatTime(ts: string): string {
    if (!ts) return '';
    const d = new Date(ts);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  }
}
