import { Routes } from '@angular/router';
import { ShellComponent } from '../../shared/components/shell/shell.component';

export const safetyOfficerRoutes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./safety-officer-dashboard/safety-officer-dashboard.component').then(m => m.SafetyOfficerDashboardComponent)
      },
      {
        path: 'active-permits',
        loadComponent: () => import('./active-permits/active-permits.component').then(m => m.ActivePermitsComponent)
      },
      {
        path: 'inspections',
        loadComponent: () => import('./inspections/inspections.component').then(m => m.InspectionsComponent)
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
