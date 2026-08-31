import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarService } from '../../../../service/sidebar.service';
import { AuthStateService } from '../../../../../core/services/auth-state.service';
import { IconComponent, IconName } from '../../../../../shared/components/icon/icon.component';

export interface PortalModuleItem {
  id: string;
  name: string;
  badge: string;
  vectorIcon?: IconName;
  icon?: string;
  fallbackEmoji: string;
  route: string;
  roleRequired?: 'ADMIN' | 'TEACHER' | 'STUDENT';
  color: string;
}

@Component({
  selector: 'app-module-drawer',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './module-drawer.html',
  styleUrl: './module-drawer.scss'
})
export class ModuleDrawer {
  private router = inject(Router);
  private sidebarService = inject(SidebarService);
  private authState = inject(AuthStateService);

  modulesList: PortalModuleItem[] = [
    {
      id: 'admin',
      name: 'Administration',
      badge: 'Academic Admin',
      icon: 'asset/icons/modules/admin_dashboard.svg',
      fallbackEmoji: '🏛️',
      route: '/admin/dashboard',
      roleRequired: 'ADMIN',
      color: 'transparent'
    },
    {
      id: 'students',
      name: 'Student Profiles',
      badge: 'Directory & Search',
      icon: 'asset/icons/modules/student_profiles.svg',
      fallbackEmoji: '👥',
      route: '/admin/students',
      roleRequired: 'ADMIN',
      color: 'transparent'
    },
    {
      id: 'courses',
      name: 'Course Offerings',
      badge: 'Curriculum & Seats',
      icon: 'asset/icons/modules/course_offerings.svg',
      fallbackEmoji: '📚',
      route: '/admin/courses',
      roleRequired: 'ADMIN',
      color: 'transparent'
    },
    {
      id: 'teachers',
      name: 'Faculty Registration',
      badge: 'Academic Staff',
      icon: 'asset/icons/modules/faculty_registration.svg',
      fallbackEmoji: '👨‍🏫',
      route: '/admin/teachers',
      roleRequired: 'ADMIN',
      color: 'transparent'
    },
    {
      id: 'semesters',
      name: 'Semester Terms',
      badge: 'Academic Cycles',
      icon: 'asset/icons/modules/semester_terms.svg',
      fallbackEmoji: '📅',
      route: '/admin/semesters',
      roleRequired: 'ADMIN',
      color: 'transparent'
    },
    {
      id: 'financial',
      name: 'Financial Ledger',
      badge: 'Fees & Dues',
      icon: 'asset/icons/modules/financial_ledger.svg',
      fallbackEmoji: '💳',
      route: '/admin/fees',
      roleRequired: 'ADMIN',
      color: 'transparent'
    },
    {
      id: 'teacher',
      name: 'Faculty Portal',
      badge: 'Grading & Classes',
      icon: 'asset/icons/modules/faculty_portal.svg',
      fallbackEmoji: '👨‍🏫',
      route: '/teacher/dashboard',
      roleRequired: 'TEACHER',
      color: 'transparent'
    },
    {
      id: 'grading',
      name: 'Grade Matrix',
      badge: 'Assessment Entry',
      icon: 'asset/icons/modules/grade_matrix.svg',
      fallbackEmoji: '📊',
      route: '/teacher/grade-entry',
      roleRequired: 'TEACHER',
      color: 'transparent'
    },
    {
      id: 'history',
      name: 'Student Dossier',
      badge: 'Transcript Audit',
      icon: 'asset/icons/modules/student_dossier.svg',
      fallbackEmoji: '📑',
      route: '/teacher/student-history',
      roleRequired: 'TEACHER',
      color: 'transparent'
    },
    {
      id: 'student',
      name: 'Student Portal',
      badge: 'Courses & Results',
      icon: 'asset/icons/modules/student_portal.jpg',
      fallbackEmoji: '🎓',
      route: '/student/dashboard',
      roleRequired: 'STUDENT',
      color: 'transparent'
    },
    {
      id: 'registration',
      name: 'Course Registration',
      badge: 'Enrollment Hub',
      icon: 'asset/icons/modules/course_reg.jpg',
      fallbackEmoji: '📝',
      route: '/student/courses',
      roleRequired: 'STUDENT',
      color: 'transparent'
    },
    {
      id: 'my-courses',
      name: 'Enrolled Courses',
      badge: 'Active Classes',
      icon: 'asset/icons/modules/enrolled_courses.jpg',
      fallbackEmoji: '📖',
      route: '/student/my-courses',
      roleRequired: 'STUDENT',
      color: 'transparent'
    },
    {
      id: 'results',
      name: 'Term Results',
      badge: 'Grades & CGPA',
      icon: 'asset/icons/modules/term_results.svg',
      fallbackEmoji: '🏆',
      route: '/student/results',
      roleRequired: 'STUDENT',
      color: 'transparent'
    },
    {
      id: 'dues',
      name: 'Fee Invoices',
      badge: 'Payment Ledger',
      icon: 'asset/icons/modules/fee_invoices.svg',
      fallbackEmoji: '💵',
      route: '/student/dues',
      roleRequired: 'STUDENT',
      color: 'transparent'
    },
    {
      id: 'student-history',
      name: 'Academic Portfolio',
      badge: 'Transcript History',
      icon: 'asset/icons/modules/academic_portfolio.svg',
      fallbackEmoji: '📜',
      route: '/student/history',
      roleRequired: 'STUDENT',
      color: 'transparent'
    }
  ];

  visibleModules(): PortalModuleItem[] {
    const role = this.authState.getRole();
    if (!role) return [];
    return this.modulesList.filter(m => m.roleRequired === role);
  }

  selectModule(module: PortalModuleItem): void {
    this.sidebarService.setSelectedModuleName(module.name);
    this.sidebarService.closeDrawer();
    this.router.navigate([module.route]);
  }

  isModuleSelected(module: PortalModuleItem): boolean {
    return this.router.url.includes(module.route) || this.router.url.startsWith(module.route);
  }

  onIconError(event: any, module: PortalModuleItem): void {
    const imgEl = event.target as HTMLImageElement;
    if (imgEl && imgEl.parentElement) {
      imgEl.style.display = 'none';
      imgEl.parentElement.innerHTML = `<span style="font-size: 22px;">${module.fallbackEmoji}</span>`;
    }
  }
}

