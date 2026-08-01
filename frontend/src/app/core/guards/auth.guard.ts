import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import { Role } from '../models/models';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthStateService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/auth/login']);
  return false;
};

export const roleGuard = (allowedRoles: Role[]): CanActivateFn => () => {
  const auth = inject(AuthStateService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) { router.navigate(['/auth/login']); return false; }
  const role = auth.getRole();
  if (role && allowedRoles.includes(role)) return true;
  router.navigate(['/unauthorized']);
  return false;
};
