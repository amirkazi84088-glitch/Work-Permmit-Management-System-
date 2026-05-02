import { Routes } from '@angular/router';
import { authGuard, roleGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Default redirect
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  // Auth routes (guests only)
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      }
    ]
  },

  // Worker routes
  {
    path: 'worker',
    canActivate: [roleGuard(['WORKER'])],
    loadChildren: () => import('./modules/worker/worker.routes').then(m => m.workerRoutes)
  },

  // Supervisor routes
  {
    path: 'supervisor',
    canActivate: [roleGuard(['SUPERVISOR', 'PERMIT_APPROVER'])],
    loadChildren: () => import('./modules/supervisor/supervisor.routes').then(m => m.supervisorRoutes)
  },

  // Safety Officer routes
  {
    path: 'safety-officer',
    canActivate: [roleGuard(['SAFETY_OFFICER'])],
    loadChildren: () => import('./modules/safety-officer/safety-officer.routes').then(m => m.safetyOfficerRoutes)
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [roleGuard(['ADMIN'])],
    loadChildren: () => import('./modules/admin/admin.routes').then(m => m.adminRoutes)
  },

  // Super Admin routes
  {
    path: 'super-admin',
    canActivate: [roleGuard(['SUPER_ADMIN'])],
    loadChildren: () => import('./modules/super-admin/super-admin.routes').then(m => m.superAdminRoutes)
  },

  // Wildcard
  { path: '**', redirectTo: '/auth/login' }
];
