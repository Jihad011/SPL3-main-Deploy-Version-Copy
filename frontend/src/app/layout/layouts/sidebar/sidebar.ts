import { Component, OnInit, OnDestroy, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';

import { MenuDrawer } from './drawers/menu-drawer/menu-drawer';
import { ModuleDrawer } from './drawers/module-drawer/module-drawer';
import { ProfileDrawer } from './drawers/profile-drawer/profile-drawer';
import { ThemePickerComponent } from './themePicker/theme-picker.component';
import { Search } from '../navbar/actions/search/search';
import { SidebarService } from '../../service/sidebar.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { AuthStateService } from '../../../core/services/auth-state.service';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MenuDrawer,
    ModuleDrawer,
    ProfileDrawer,
    ThemePickerComponent,
    Search
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit, OnDestroy {
  activeItem: string = 'Menu';
  drawerOpen: boolean = false;
  drawerType: string = 'Menu';
  sidebarExpanded: boolean = false;
  isMobileOpen: boolean = false;
  activeTheme: string = 'blue';

  private sidebarService = inject(SidebarService);
  private themeService = inject(ThemeService);
  private authState = inject(AuthStateService);
  private router = inject(Router);
  private subs = new Subscription();

  ngOnInit(): void {
    this.activeTheme = this.themeService.getCurrentTheme();

    this.subs.add(
      this.themeService.currentTheme$.subscribe(themeId => {
        this.activeTheme = themeId;
      })
    );

    this.subs.add(
      this.sidebarService.sidebarExpanded$.subscribe(expanded => {
        this.sidebarExpanded = expanded;
      })
    );

    this.subs.add(
      this.sidebarService.drawerOpen$.subscribe(open => {
        this.drawerOpen = open;
      })
    );

    this.handleResize();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  @HostListener('window:resize')
  handleResize(): void {
    const width = window.innerWidth;
    this.isMobileOpen = width < 768;
  }

  toggleSidebar(): void {
    this.sidebarExpanded = !this.sidebarExpanded;
    this.sidebarService.setSidebarState(this.sidebarExpanded);
  }

  toggleDrawer(type: string): void {
    if (this.drawerOpen && this.drawerType === type) {
      this.closeDrawer();
    } else {
      this.drawerType = type;
      this.drawerOpen = true;
      this.sidebarService.setDrawerOpen(true);
    }
  }

  closeDrawer(): void {
    this.drawerOpen = false;
    this.sidebarService.setDrawerOpen(false);
  }

  setActiveItem(item: string): void {
    this.activeItem = item;
  }

  navigateToDashboard(): void {
    this.closeDrawer();
    const role = this.authState.getRole();
    if (role === 'ADMIN') this.router.navigate(['/admin/dashboard']);
    else if (role === 'TEACHER') this.router.navigate(['/teacher/dashboard']);
    else if (role === 'STUDENT') this.router.navigate(['/student/dashboard']);
  }

  navigateToReports(): void {
    // Functionality disabled per user request until dedicated reports module is implemented
  }

  logout(): void {
    this.closeDrawer();
    this.authState.logout();
    this.router.navigate(['/auth/login']);
  }

  // Theme-aware SVG Icon Getters
  getMenuIcon(): string {
    switch (this.activeTheme) {
      case 'rose': return 'asset/icons/roseMenu.svg';
      case 'MidnightBlue': return 'asset/icons/menu_midnight.svg';
      case 'emerald': return 'asset/icons/greenMenu.svg';
      case 'purple': return 'asset/icons/purpleMenu.svg';
      case 'Lavendar': return 'asset/icons/lavendarMenu.svg';
      case 'dark': return 'asset/icons/blackMenu.svg';
      default: return 'asset/icons/menu1.svg';
    }
  }

  getApplicationIcon(): string {
    switch (this.activeTheme) {
      case 'rose': return 'asset/icons/roseApplication.svg';
      case 'MidnightBlue': return 'asset/icons/midnightApplication.svg';
      case 'emerald': return 'asset/icons/greenApplication.svg';
      case 'purple': return 'asset/icons/purpleApplication.svg';
      case 'Lavendar': return 'asset/icons/lavendarApplication.svg';
      case 'dark': return 'asset/icons/blackApplication.svg';
      default: return 'asset/icons/application.svg';
    }
  }

  getDashboardIcon(): string {
    switch (this.activeTheme) {
      case 'rose': return 'asset/icons/roseDashboard.svg';
      case 'MidnightBlue': return 'asset/icons/midnightDashboard.svg';
      case 'emerald': return 'asset/icons/greenDashboard.svg';
      case 'purple': return 'asset/icons/purpleDashboard.svg';
      case 'Lavendar': return 'asset/icons/lavendarDashboard.svg';
      case 'dark': return 'asset/icons/blackDashboard.svg';
      default: return 'asset/icons/dashboard1.svg';
    }
  }

  getProfileIcon(): string {
    switch (this.activeTheme) {
      case 'rose': return 'asset/icons/roseProfile.svg';
      case 'MidnightBlue': return 'asset/icons/midnightProfile.svg';
      case 'emerald': return 'asset/icons/greenProfile.svg';
      case 'purple': return 'asset/icons/purpleProfile.svg';
      case 'Lavendar': return 'asset/icons/lavendarProfile.svg';
      case 'dark': return 'asset/icons/blackProfile.svg';
      default: return 'asset/icons/profile3.svg';
    }
  }

  getReportIcon(): string {
    switch (this.activeTheme) {
      case 'rose': return 'asset/icons/roseReport.svg';
      case 'MidnightBlue': return 'asset/icons/midnightReport.svg';
      case 'emerald': return 'asset/icons/greenReport.svg';
      case 'purple': return 'asset/icons/purpleReport.svg';
      case 'Lavendar': return 'asset/icons/lavendarReport.svg';
      case 'dark': return 'asset/icons/blackReport.svg';
      default: return 'asset/icons/report.svg';
    }
  }

  getSecurityIcon(): string {
    switch (this.activeTheme) {
      case 'rose': return 'asset/icons/roseSecurity.svg';
      case 'MidnightBlue': return 'asset/icons/midnightSecurity.svg';
      case 'emerald': return 'asset/icons/greenSecurity.svg';
      case 'purple': return 'asset/icons/purpleSecurity.svg';
      case 'Lavendar': return 'asset/icons/lavendarSecurity.svg';
      case 'dark': return 'asset/icons/blackSecurity.svg';
      default: return 'asset/icons/security.svg';
    }
  }

  getLogoutIcon(): string {
    switch (this.activeTheme) {
      case 'rose': return 'asset/icons/roseLogout.svg';
      case 'MidnightBlue': return 'asset/icons/midnightLogout.svg';
      case 'emerald': return 'asset/icons/greenLogout.svg';
      case 'purple': return 'asset/icons/purpleLogout.svg';
      case 'Lavendar': return 'asset/icons/lavendarLogout.svg';
      case 'dark': return 'asset/icons/blackLogout.svg';
      default: return 'asset/icons/logout1.svg';
    }
  }
}

