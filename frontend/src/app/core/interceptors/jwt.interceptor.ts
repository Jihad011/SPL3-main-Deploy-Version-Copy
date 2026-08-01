import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';

/**
 * JWT Interceptor — automatically attaches the Bearer token to every
 * outgoing request. Uses Angular 18 functional interceptor pattern.
 */
export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authState = inject(AuthStateService);

  // Fallback to Authorization header if cookies are blocked by browser on localhost
  const user = authState.user();
  const token = user?.token;

  let headers = req.headers;
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  // Send HttpOnly cookie automatically with every request
  const authReq = req.clone({
    headers,
    withCredentials: true
  });

  return next(authReq).pipe(
    catchError(err => {
      // Auto-logout on 401 Unauthorized (expired/invalid token)
      if (err.status === 401) {
        authState.clearSession();
      }
      return throwError(() => err);
    })
  );
};
