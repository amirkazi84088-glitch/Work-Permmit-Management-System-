import { Routes } from '@angular/router';
import { ShellComponent } from '../../shared/components/shell/shell.component';

export const superAdminRoutes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./super-admin-dashboard/super-admin-dashboard.component').then(m => m.SuperAdminDashboardComponent)
      },
      {
        path: 'organizations',
        loadComponent: () => import('./organizations/organizations.component').then(m => m.OrganizationsComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./all-users/all-users.component').then(m => m.AllUsersComponent)
      },
      {
        path: 'permits',
        loadComponent: () => import('./global-permits/global-permits.component').then(m => m.GlobalPermitsComponent)
      },
      {
        path: 'system-config',
        loadComponent: () => import('./system-config/system-config.component').then(m => m.SystemConfigComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./global-reports/global-reports.component').then(m => m.GlobalReportsComponent)
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
