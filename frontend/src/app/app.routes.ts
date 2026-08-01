import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { authGuard, roleGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';
import { AuthStateService } from './core/services/auth-state.service';

export const routes: Routes = [
  // ── Public ────────────────────────────────────────────────
  { 
    path: '', 
    pathMatch: 'full',
    redirectTo: () => {
      const auth = inject(AuthStateService);
      if (auth.isLoggedIn()) {
        const role = auth.getRole();
        if (role === 'ADMIN') return '/admin/dashboard';
        if (role === 'TEACHER') return '/teacher/dashboard';
        if (role === 'STUDENT') return '/student/dashboard';
      }
      return '/auth/login';
    }
  },
  {
    path: 'auth',
    canActivate: [publicGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/unauthorized/unauthorized.component')
      .then(m => m.UnauthorizedComponent)
  },

  // ── Student (lazy-loaded) ──────────────────────────────────
  {
    path: 'student',
    canActivate: [roleGuard(['STUDENT'])],
    loadChildren: () => import('./features/student/student.routes').then(m => m.STUDENT_ROUTES)
  },

  // ── Teacher (lazy-loaded) ──────────────────────────────────
  {
    path: 'teacher',
    canActivate: [roleGuard(['TEACHER'])],
    loadChildren: () => import('./features/teacher/teacher.routes').then(m => m.TEACHER_ROUTES)
  },

  // ── Admin (lazy-loaded) ───────────────────────────────────
  {
    path: 'admin',
    canActivate: [roleGuard(['ADMIN'])],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },

  // ── Wildcard ──────────────────────────────────────────────
  { 
    path: '**', 
    redirectTo: () => {
      const auth = inject(AuthStateService);
      if (auth.isLoggedIn()) {
        const role = auth.getRole();
        if (role === 'ADMIN') return '/admin/dashboard';
        if (role === 'TEACHER') return '/teacher/dashboard';
        if (role === 'STUDENT') return '/student/dashboard';
      }
      return '/auth/login';
    }
  }
];
