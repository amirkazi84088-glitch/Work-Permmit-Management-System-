import { Routes } from '@angular/router';
import { ShellComponent } from '../../shared/components/shell/shell.component';

export const workerRoutes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./worker-dashboard/worker-dashboard.component').then(m => m.WorkerDashboardComponent)
      },
      {
        path: 'apply-permit',
        loadComponent: () => import('./apply-permit/apply-permit.component').then(m => m.ApplyPermitComponent)
      },
      {
        path: 'my-permits',
        loadComponent: () => import('./my-permits/my-permits.component').then(m => m.MyPermitsComponent)
      },
      {
        path: 'permit/:id',
        loadComponent: () => import('./permit-detail/permit-detail.component').then(m => m.PermitDetailComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('../../shared/components/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  }
];
