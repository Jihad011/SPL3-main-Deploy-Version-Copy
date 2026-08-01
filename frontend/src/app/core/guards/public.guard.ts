import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

export const publicGuard: CanActivateFn = () => {
  const auth = inject(AuthStateService);
  const router = inject(Router);
  if (auth.isLoggedIn()) {
    const role = auth.getRole();
    if (role === 'ADMIN') { router.navigate(['/admin/dashboard']); return false; }
    if (role === 'TEACHER') { router.navigate(['/teacher/dashboard']); return false; }
    if (role === 'STUDENT') { router.navigate(['/student/dashboard']); return false; }
  }
  return true;
};