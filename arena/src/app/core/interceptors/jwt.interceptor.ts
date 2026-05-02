import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.token();
  const isAuthEndpoint = req.url.includes('/auth/login') ||
                         req.url.includes('/auth/forgot-password') ||
                         req.url.includes('/auth/reset-password') ||
                         req.url.includes('/auth/refresh');

  // Attach token to non-auth requests
  if (token && !isAuthEndpoint) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint) {
        authService.clearAuthState();
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
