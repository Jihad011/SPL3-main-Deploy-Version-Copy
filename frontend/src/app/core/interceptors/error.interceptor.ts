import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { AuthStateService } from '../services/auth-state.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const authState = inject(AuthStateService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error) {
        if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.error.detail) {
          // Handle RFC 7807 ProblemDetail format
          errorMessage = error.error.detail;
          if (error.error.fieldErrors) {
             const fields = Object.keys(error.error.fieldErrors).map(k => `${k}: ${error.error.fieldErrors[k]}`).join(', ');
             errorMessage += ` (${fields})`;
          }
        } else if (error.error.message) {
          errorMessage = error.error.message;
        }
      }

      if (error.status === 401) {
        toastService.error('Session expired. Please login again.');
        authState.logout();
      } else if (error.status === 403) {
        toastService.error(errorMessage || 'Access denied: insufficient permissions.');
      } else if (error.status === 429) {
        toastService.error('Too many requests. Please wait a minute and try again.');
      } else {
        toastService.error(errorMessage);
      }

      return throwError(() => error);
    })
  );
};
