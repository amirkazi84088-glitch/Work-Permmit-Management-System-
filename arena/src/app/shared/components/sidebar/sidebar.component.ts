import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: UserRole[];
  badge?: string;
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  // Worker
  { label: 'Dashboard',         icon: '\u{1F4CA}', route: '/worker/dashboard',         roles: ['WORKER'] },
  { label: 'Apply for Permit',  icon: '\u{1F4DD}', route: '/worker/apply-permit',       roles: ['WORKER'] },
  { label: 'My Permits',        icon: '\u{1F4CB}', route: '/worker/my-permits',         roles: ['WORKER'] },

  // Supervisor
  { label: 'Dashboard',         icon: '\u{1F4CA}', route: '/supervisor/dashboard',      roles: ['SUPERVISOR', 'PERMIT_APPROVER'] },
  { label: 'Pending Approvals', icon: '\u23F3', route: '/supervisor/pending-approvals', roles: ['SUPERVISOR', 'PERMIT_APPROVER'] },
  { label: 'Team Permits',      icon: '\u{1F465}', route: '/supervisor/team-permits',   roles: ['SUPERVISOR', 'PERMIT_APPROVER'] },

  // Safety Officer
  { label: 'Dashboard',         icon: '\u{1F4CA}', route: '/safety-officer/dashboard',  roles: ['SAFETY_OFFICER'] },
  { label: 'Active Permits',    icon: '\u2705', route: '/safety-officer/active-permits', roles: ['SAFETY_OFFICER'] },
  { label: 'Inspections',       icon: '\u{1F50D}', route: '/safety-officer/inspections', roles: ['SAFETY_OFFICER'] },

  // Admin
  { label: 'Dashboard',         icon: '\u{1F4CA}', route: '/admin/dashboard',           roles: ['ADMIN'] },
  { label: 'All Permits',       icon: '\u{1F4CB}', route: '/admin/permits',             roles: ['ADMIN'] },
  { label: 'User Management',   icon: '\u{1F464}', route: '/admin/users',               roles: ['ADMIN'] },
  { label: 'Departments',       icon: '\u{1F3E2}', route: '/admin/departments',         roles: ['ADMIN'] },
  { label: 'Audit Log',         icon: '\u{1F4DC}', route: '/admin/audit-log',           roles: ['ADMIN'] },
  { label: 'Reports',           icon: '\u{1F4C8}', route: '/admin/reports',             roles: ['ADMIN'] },

  // Super Admin
  { label: 'Dashboard',         icon: '\u{1F4CA}', route: '/super-admin/dashboard',     roles: ['SUPER_ADMIN'] },
  { label: 'Organizations',     icon: '\u{1F3ED}', route: '/super-admin/organizations', roles: ['SUPER_ADMIN'] },
  { label: 'All Users',         icon: '\u{1F465}', route: '/super-admin/users',         roles: ['SUPER_ADMIN'] },
  { label: 'All Permits',       icon: '\u{1F4CB}', route: '/super-admin/permits',       roles: ['SUPER_ADMIN'] },
  { label: 'System Config',     icon: '\u2699\uFE0F', route: '/super-admin/system-config', roles: ['SUPER_ADMIN'] },
  { label: 'Global Reports',    icon: '\u{1F4C8}', route: '/super-admin/reports',       roles: ['SUPER_ADMIN'] },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <span class="logo-icon">{{ '\u{1F3D7}\uFE0F' }}</span>
          @if (!collapsed) {
            <div class="logo-text">
              <span class="logo-name">WPMS</span>
              <span class="logo-sub">Permit System</span>
            </div>
          }
        </div>
        <button class="collapse-btn" (click)="toggleCollapse.emit()" title="Toggle sidebar">
          {{ collapsed ? '\u25B6' : '\u25C0' }}
        </button>
      </div>

      @if (!collapsed && authService.user()) {
        <div class="sidebar-user">
          <div class="user-avatar">
            {{ getUserInitials() }}
          </div>
          <div class="user-info">
            <span class="user-name">{{ authService.user()?.firstName }} {{ authService.user()?.lastName }}</span>
            <span class="user-role">{{ getRoleLabel() }}</span>
          </div>
        </div>
      }

      <nav class="sidebar-nav">
        <ul>
          @for (item of visibleItems(); track item.route) {
            <li>
              <a
                [routerLink]="item.route"
                routerLinkActive="active"
                class="nav-item"
                [title]="collapsed ? item.label : ''"
              >
                <span class="nav-icon">{{ item.icon }}</span>
                @if (!collapsed) {
                  <span class="nav-label">{{ item.label }}</span>
                  @if (item.badge) {
                    <span class="nav-badge">{{ item.badge }}</span>
                  }
                }
              </a>
            </li>
          }
        </ul>
      </nav>

      <div class="sidebar-footer">
        <a
          [routerLink]="getProfileRoute()"
          class="nav-item"
          routerLinkActive="active"
          [title]="collapsed ? 'Profile' : ''"
        >
          <span class="nav-icon">{{ '\u{1F464}' }}</span>
          @if (!collapsed) { <span class="nav-label">My Profile</span> }
        </a>
        <button class="nav-item logout-btn" (click)="authService.logout()" [title]="collapsed ? 'Logout' : ''">
          <span class="nav-icon">{{ '\u{1F6AA}' }}</span>
          @if (!collapsed) { <span class="nav-label">Logout</span> }
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      width: var(--sidebar-width);
      background: var(--sidebar-bg);
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      z-index: 100;
      overflow: hidden;
    }

    .sidebar.collapsed { width: var(--sidebar-collapsed-width); }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      min-height: 64px;
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      overflow: hidden;
    }

    .logo-icon { font-size: 28px; flex-shrink: 0; }

    .logo-text {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .logo-name {
      font-size: 1.1rem;
      font-weight: 800;
      color: white;
      letter-spacing: 0.5px;
    }

    .logo-sub {
      font-size: 0.7rem;
      color: #64748b;
      white-space: nowrap;
    }

    .collapse-btn {
      display: none;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: #94a3b8;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      flex-shrink: 0;
      transition: all 0.2s;
      &:hover { background: rgba(255,255,255,0.1); color: white; }
    }

    .sidebar-user {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #1e40af;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .user-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: white;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 0.72rem;
      color: #64748b;
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 12px 8px;

      ul {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: flex-start;
      padding: 10px 12px;
      border-radius: 8px;
      color: var(--sidebar-text);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      border: none;
      background: none;
      width: 100%;
      white-space: nowrap;

      &:hover {
        background: var(--sidebar-hover-bg);
        color: white;
      }

      &.active {
        background: var(--sidebar-active-bg);
        color: var(--sidebar-text-active);
      }
    }

    .sidebar.collapsed .nav-item {
      justify-content: center;
    }

    .nav-icon { font-size: 18px; flex-shrink: 0; width: 24px; text-align: center; }
    .nav-label {
      flex: 1 1 auto;
      min-width: 0;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      color: inherit;
    }

    .nav-badge {
      background: #ef4444;
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 999px;
      flex-shrink: 0;
    }

    .sidebar-footer {
      padding: 8px;
      border-top: 1px solid rgba(255,255,255,0.08);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .logout-btn {
      color: #f87171;
      &:hover { background: rgba(239, 68, 68, 0.1); color: #fca5a5; }
    }

  `]
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  authService = inject(AuthService);

  visibleItems = computed(() => {
    const role = this.authService.user()?.role;
    return NAV_ITEMS.filter(item => role && item.roles.includes(role as UserRole));
  });

  getUserInitials(): string {
    const u = this.authService.user();
    if (!u) return '?';
    return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
  }

  getRoleLabel(): string {
    const labels: Record<UserRole, string> = {
      WORKER: 'Worker',
      SUPERVISOR: 'Supervisor',
      PERMIT_APPROVER: 'Permit Approver',
      SAFETY_OFFICER: 'Safety Officer',
      ADMIN: 'Admin',
      SUPER_ADMIN: 'Super Admin'
    };
    return labels[this.authService.user()?.role as UserRole] ?? '';
  }

  getProfileRoute(): string {
    const role = this.authService.user()?.role;
    const map: Record<string, string> = {
      WORKER: '/worker/profile',
      SUPERVISOR: '/supervisor/profile',
      PERMIT_APPROVER: '/supervisor/profile',
      SAFETY_OFFICER: '/safety-officer/profile',
      ADMIN: '/admin/profile',
      SUPER_ADMIN: '/super-admin/profile'
    };
    return map[role ?? ''] ?? '/';
  }
}
