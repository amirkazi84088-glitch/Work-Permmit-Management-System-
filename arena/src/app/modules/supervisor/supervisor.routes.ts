import { Routes } from '@angular/router';
import { ShellComponent } from '../../shared/components/shell/shell.component';

export const supervisorRoutes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./supervisor-dashboard/supervisor-dashboard.component').then(m => m.SupervisorDashboardComponent)
      },
      {
        path: 'pending-approvals',
        loadComponent: () => import('./pending-approvals/pending-approvals.component').then(m => m.PendingApprovalsComponent)
      },
      {
        path: 'team-permits',
        loadComponent: () => import('./team-permits/team-permits.component').then(m => m.TeamPermitsComponent)
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
