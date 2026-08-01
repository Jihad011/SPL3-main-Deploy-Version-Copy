import { Routes } from '@angular/router';

export const TEACHER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/teacher-layout.component').then(m => m.TeacherLayoutComponent),
    children: [
      { path: 'dashboard',   loadComponent: () => import('./dashboard/teacher-dashboard.component').then(m => m.TeacherDashboardComponent) },
      { path: 'grade-entry', loadComponent: () => import('./grade-entry/grade-entry.component').then(m => m.GradeEntryComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
