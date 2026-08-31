import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { Save } from './actions/save/save';
import { View } from './actions/view/view';
import { Delete } from './actions/delete/delete';
import { Reset } from './actions/reset/reset';
import { Exit } from './actions/exit/exit';
import { Update } from './actions/update/update';
import { CustomAction } from './actions/custom-action/custom-action';
import { BUTTON_VISIBILITY, ButtonUtils } from '../../../shared/constant/button-signals.constant';
import { SidebarService } from '../../service/sidebar.service';
import { AuthStateService } from '../../../core/services/auth-state.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    Save,
    View,
    Delete,
    Reset,
    Exit,
    Update,
    CustomAction
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit {
  buttons = BUTTON_VISIBILITY;
  toggleMenu: boolean = false;
  moduleName = signal('SPL3 Open Credit');
  currentPageName = signal('Dashboard');

  private sidebarService = inject(SidebarService);
  private authState = inject(AuthStateService);
  private router = inject(Router);

  ngOnInit(): void {
    this.sidebarService.selectedModuleName$.subscribe(name => {
      if (name) this.moduleName.set(name);
    });

    this.sidebarService.currentPageName$.subscribe(name => {
      if (name) this.currentPageName.set(name);
    });

    this.updatePageTitleFromRoute();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.updatePageTitleFromRoute());
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }

  navigateToHome(): void {
    const role = this.authState.getRole();
    if (role === 'ADMIN') this.router.navigate(['/admin/dashboard']);
    else if (role === 'TEACHER') this.router.navigate(['/teacher/dashboard']);
    else if (role === 'STUDENT') this.router.navigate(['/student/dashboard']);
  }

  isButtonVisible(key: string): boolean {
    return ButtonUtils.isButtonVisible(key as any);
  }

  isButtonEnabled(key: string): boolean {
    return ButtonUtils.isButtonEnabled(key as any);
  }

  private updatePageTitleFromRoute(): void {
    const url = this.router.url;
    if (url.includes('/admin/students')) this.sidebarService.setCurrentPageName('Student Profile Setup');
    else if (url.includes('/admin/courses')) this.sidebarService.setCurrentPageName('Course Offering Setup');
    else if (url.includes('/admin/teachers')) this.sidebarService.setCurrentPageName('Faculty Registration');
    else if (url.includes('/admin/semesters')) this.sidebarService.setCurrentPageName('Semester Term Setup');
    else if (url.includes('/admin/fees')) this.sidebarService.setCurrentPageName('Fee Invoice Demand');
    else if (url.includes('/admin/dashboard')) this.sidebarService.setCurrentPageName('Administration Dashboard');
    else if (url.includes('/teacher/grade-entry')) this.sidebarService.setCurrentPageName('Course Assessment Grade Sheet');
    else if (url.includes('/teacher/student-history')) this.sidebarService.setCurrentPageName('Student History Dossier');
    else if (url.includes('/teacher/dashboard')) this.sidebarService.setCurrentPageName('Faculty Dashboard');
    else if (url.includes('/student/courses')) this.sidebarService.setCurrentPageName('Course Registration');
    else if (url.includes('/student/my-courses')) this.sidebarService.setCurrentPageName('My Enrolled Courses');
    else if (url.includes('/student/results')) this.sidebarService.setCurrentPageName('Academic Term Results');
    else if (url.includes('/student/dues')) this.sidebarService.setCurrentPageName('Student Dues & Invoices');
    else if (url.includes('/student/history')) this.sidebarService.setCurrentPageName('Academic Transcript History');
    else if (url.includes('/student/dashboard')) this.sidebarService.setCurrentPageName('Student Dashboard');
  }
}
