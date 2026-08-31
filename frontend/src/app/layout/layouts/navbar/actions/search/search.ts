import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarService } from '../../../../service/sidebar.service';
import { AuthStateService } from '../../../../../core/services/auth-state.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative inline-block w-full">
      <input
        type="text"
        placeholder="Fast Path..."
        [(ngModel)]="searchQuery"
        (keydown.enter)="handleFastPath()"
        class="search-fastpath"
      />

    </div>
  `,
  styles: [`
    .search-fastpath {
      font-size: 11px;
      background: #ffffff;
      color: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.4);
      border-radius: 6px;
      padding: 4px 8px;
      width: 100%;
      outline: none;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
    }
    .search-fastpath:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    .search-fastpath::placeholder {
      color: #94a3b8;
      font-size: 10.5px;
    }
  `]
})
export class Search {
  searchQuery = '';
  private router = inject(Router);
  private sidebarService = inject(SidebarService);
  private authState = inject(AuthStateService);

  private fastPathMap: Record<string, { route: string; title: string }> = {
    '01': { route: '/admin/dashboard', title: 'Admin Dashboard' },
    '02': { route: '/admin/students', title: 'Student Profiles' },
    '03': { route: '/admin/courses', title: 'Course Offerings' },
    '04': { route: '/admin/teachers', title: 'Faculty Registration' },
    '05': { route: '/admin/semesters', title: 'Semester Terms' },
    '06': { route: '/admin/fees', title: 'Student Fee Invoices' },
    '10': { route: '/teacher/dashboard', title: 'Faculty Dashboard' },
    '11': { route: '/teacher/grade-entry', title: 'Grade Entry Matrix' },
    '12': { route: '/teacher/student-history', title: 'Student Academic Dossier' },
    '20': { route: '/student/dashboard', title: 'Student Dashboard' },
    '21': { route: '/student/courses', title: 'Course Registration' },
    '22': { route: '/student/my-courses', title: 'My Enrolled Courses' },
    '23': { route: '/student/results', title: 'Term Academic Results' },
    '24': { route: '/student/dues', title: 'Fee Invoices & Dues' },
    '25': { route: '/student/history', title: 'Academic Portfolio' },
  };

  handleFastPath(): void {
    const query = this.searchQuery.trim();
    const role = this.authState.getRole();
    if (this.fastPathMap[query]) {
      const target = this.fastPathMap[query];
      const isAllowed =
        (role === 'ADMIN' && target.route.startsWith('/admin')) ||
        (role === 'TEACHER' && target.route.startsWith('/teacher')) ||
        (role === 'STUDENT' && target.route.startsWith('/student'));

      if (isAllowed) {
        this.sidebarService.setCurrentPageName(target.title);
        this.router.navigate([target.route]);
      }
      this.searchQuery = '';
    }
  }
}

