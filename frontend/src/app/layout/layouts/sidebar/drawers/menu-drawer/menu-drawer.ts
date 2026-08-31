import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthStateService } from '../../../../../core/services/auth-state.service';
import { SidebarService } from '../../../../service/sidebar.service';

export interface CenterPointMenuItem {
  FunctionName: string;
  ModuleName: string;
  AppRoute: string;
  QuickRouteNo?: string;
  icon?: string;
}

export interface CenterPointMenuSection {
  key: string;
  label: string;
  icon: string;
  items: CenterPointMenuItem[];
}

@Component({
  selector: 'app-menu-drawer',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="menu-drawer-body">
      <div *ngFor="let section of visibleSections()" class="menu-section">
        <!-- Section Header -->
        <div class="menu-section-header" (click)="toggleSection(section.key)">
          <div class="menu-section-left">
            <div class="menu-section-icon-box">
              <mat-icon class="section-icon">{{ section.icon }}</mat-icon>
            </div>
            <span class="menu-section-label">{{ section.label }}</span>
          </div>
          <mat-icon class="menu-chevron">{{ isSectionOpen(section.key) ? 'expand_less' : 'expand_more' }}</mat-icon>
        </div>

        <!-- Section Items -->
        <div class="menu-items-wrap" [style.display]="isSectionOpen(section.key) ? 'block' : 'none'">
          <div class="menu-items-list">
            <div
              *ngFor="let item of section.items"
              [routerLink]="item.AppRoute"
              routerLinkActive="menu-item-active"
              [routerLinkActiveOptions]="{ exact: true }"
              (click)="onMenuItemClick(item)"
              class="menu-item"
            >
              <span class="menu-item-arrow">›</span>
              <div class="menu-item-content">
                <div class="menu-item-top-row">
                  <span class="menu-item-name">{{ item.FunctionName }}</span>
                  <span *ngIf="item.QuickRouteNo" class="menu-item-shortcut">{{ item.QuickRouteNo }}</span>
                </div>
                <span class="menu-item-module">{{ item.ModuleName }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .menu-drawer-body {
      padding-bottom: 2rem;
    }
    .menu-section {
      border-bottom: 1px solid #e5e7eb;
    }
    .menu-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      cursor: pointer;
      transition: background 0.15s;
      user-select: none;

      &:hover {
        background: #eff6ff;
      }
    }
    .menu-section-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .menu-section-icon-box {
      width: 30px;
      height: 30px;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .section-icon {
      color: #2563eb;
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      line-height: 18px !important;
    }
    .menu-section-label {
      font-size: 13px;
      font-weight: 600;
      color: #1f2937;
    }
    .menu-chevron {
      color: #9ca3af;
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      line-height: 18px !important;
    }
    .menu-items-wrap {
      background: #f9fafb;
    }
    .menu-items-list {
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .menu-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.15s;
      text-decoration: none;
      color: inherit;

      &:hover {
        background: #e5e7eb;
      }
    }
    .menu-item.menu-item-active {
      background: rgba(59, 130, 246, 0.12);
    }
    .menu-item-arrow {
      color: #3b82f6;
      font-size: 16px;
      font-weight: 700;
      margin-top: 1px;
      flex-shrink: 0;
    }
    .menu-item-content {
      flex: 1;
      min-width: 0;
    }
    .menu-item-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .menu-item-name {
      font-size: 12px;
      font-weight: 500;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .menu-item-shortcut {
      background: #dbeafe;
      color: #1d4ed8;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      white-space: nowrap;
      font-family: monospace;
      flex-shrink: 0;
    }
    .menu-item-module {
      font-size: 10px;
      color: #6b7280;
      display: block;
      margin-top: 2px;
    }
  `],

  animations: [
    trigger('expandCollapse', [
      state('open', style({ height: '*', opacity: 1 })),
      state('closed', style({ height: '0px', opacity: 0 })),
      transition('open <=> closed', animate('250ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ])
  ]
})
export class MenuDrawer {
  private authState = inject(AuthStateService);
  private sidebarService = inject(SidebarService);
  private router = inject(Router);

  private openSections = new Set<string>(['admin', 'teacher', 'student']);

  menuSections: CenterPointMenuSection[] = [
    {
      key: 'admin',
      label: 'Academic Setup & Governance',
      icon: 'account_balance',
      items: [
        { FunctionName: 'Admin Dashboard', ModuleName: 'System Core', AppRoute: '/admin/dashboard', QuickRouteNo: '01' },
        { FunctionName: 'Student Profiles', ModuleName: 'Student Directory', AppRoute: '/admin/students', QuickRouteNo: '02' },
        { FunctionName: 'Course Offerings', ModuleName: 'Curriculum & Seats', AppRoute: '/admin/courses', QuickRouteNo: '03' },
        { FunctionName: 'Faculty Registration', ModuleName: 'Academic Staff', AppRoute: '/admin/teachers', QuickRouteNo: '04' },
        { FunctionName: 'Semester Terms', ModuleName: 'Academic Cycles', AppRoute: '/admin/semesters', QuickRouteNo: '05' },
        { FunctionName: 'Student Fee Invoices', ModuleName: 'Financial Ledger', AppRoute: '/admin/fees', QuickRouteNo: '06' }
      ]
    },
    {
      key: 'teacher',
      label: 'Faculty & Assessment',
      icon: 'school',
      items: [
        { FunctionName: 'Faculty Dashboard',        ModuleName: 'Course Allocations', AppRoute: '/teacher/dashboard',       QuickRouteNo: '10' },
        { FunctionName: 'Grade Entry Matrix',        ModuleName: 'Marks Submission',   AppRoute: '/teacher/grade-entry',     QuickRouteNo: '11' },
        { FunctionName: 'Student Academic Dossier', ModuleName: 'Transcript Audit',   AppRoute: '/teacher/student-history', QuickRouteNo: '12' }
      ]
    },
    {
      key: 'student',
      label: 'Student Academic Portal',
      icon: 'person_outline',
      items: [
        { FunctionName: 'Student Dashboard', ModuleName: 'Overview & CGPA', AppRoute: '/student/dashboard', QuickRouteNo: '20' },
        { FunctionName: 'Course Registration', ModuleName: 'Term Enrollment', AppRoute: '/student/courses', QuickRouteNo: '21' },
        { FunctionName: 'My Enrolled Courses', ModuleName: 'Active Classes', AppRoute: '/student/my-courses', QuickRouteNo: '22' },
        { FunctionName: 'Term Academic Results', ModuleName: 'Grade Sheets', AppRoute: '/student/results', QuickRouteNo: '23' },
        { FunctionName: 'Fee Invoices & Dues', ModuleName: 'Payment Ledger', AppRoute: '/student/dues', QuickRouteNo: '24' },
        { FunctionName: 'Academic Portfolio', ModuleName: 'Transcript History', AppRoute: '/student/history', QuickRouteNo: '25' }
      ]
    }
  ];

  visibleSections(): CenterPointMenuSection[] {
    const role = this.authState.getRole();
    if (role === 'ADMIN') {
      return this.menuSections.filter(s => s.key === 'admin');
    }
    if (role === 'TEACHER') {
      return this.menuSections.filter(s => s.key === 'teacher');
    }
    if (role === 'STUDENT') {
      return this.menuSections.filter(s => s.key === 'student');
    }
    return [];
  }

  isSectionOpen(key: string): boolean {
    return this.openSections.has(key);
  }

  toggleSection(key: string): void {
    if (this.openSections.has(key)) {
      this.openSections.delete(key);
    } else {
      this.openSections.add(key);
    }
  }

  onMenuItemClick(item: CenterPointMenuItem): void {
    this.sidebarService.setCurrentPageName(item.FunctionName);
    this.sidebarService.closeDrawer();
  }
}
