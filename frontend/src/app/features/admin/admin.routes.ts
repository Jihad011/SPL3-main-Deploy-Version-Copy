import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: 'dashboard',          loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'students',           loadComponent: () => import('./students/student-management.component').then(m => m.StudentManagementComponent) },
      { path: 'courses',            loadComponent: () => import('./courses/course-management.component').then(m => m.CourseManagementComponent) },
      { path: 'teachers',           loadComponent: () => import('./teachers/teacher-management.component').then(m => m.TeacherManagementComponent) },
      { path: 'fees',               loadComponent: () => import('./fees/fee-management.component').then(m => m.FeeManagementComponent) },
      { path: 'semesters',          loadComponent: () => import('./semesters/semester-management.component').then(m => m.SemesterManagementComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
