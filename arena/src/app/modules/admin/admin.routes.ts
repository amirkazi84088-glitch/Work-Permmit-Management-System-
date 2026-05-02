import { Routes } from '@angular/router';
import { ShellComponent } from '../../shared/components/shell/shell.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./user-management/user-management.component').then(m => m.UserManagementComponent)
      },
      {
        path: 'departments',
        loadComponent: () => import('./departments/departments.component').then(m => m.DepartmentsComponent)
      },
      {
        path: 'permits',
        loadComponent: () => import('./all-permits/all-permits.component').then(m => m.AllPermitsComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'audit-log',
        loadComponent: () => import('../safety-officer/audit-log/audit-log.component').then(m => m.AuditLogComponent)
      },
      {
        path: 'permit/:id',
        loadComponent: () => import('../worker/permit-detail/permit-detail.component').then(m => m.PermitDetailComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('../../shared/components/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  }
];
