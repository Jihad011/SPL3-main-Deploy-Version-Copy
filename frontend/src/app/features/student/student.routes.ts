import { Routes } from '@angular/router';

export const STUDENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/student-layout.component').then(m => m.StudentLayoutComponent),
    children: [
      { path: 'dashboard',     loadComponent: () => import('./dashboard/student-dashboard.component').then(m => m.StudentDashboardComponent) },
      { path: 'courses',       loadComponent: () => import('./course-registration/course-registration.component').then(m => m.CourseRegistrationComponent) },
      { path: 'my-courses',    loadComponent: () => import('./my-courses/my-courses.component').then(m => m.MyCoursesComponent) },
      { path: 'results',       loadComponent: () => import('./results/results.component').then(m => m.ResultsComponent) },
      { path: 'history',       loadComponent: () => import('./history/academic-history.component').then(m => m.AcademicHistoryComponent) },
      { path: 'dues',          loadComponent: () => import('./dues/dues.component').then(m => m.DuesComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
