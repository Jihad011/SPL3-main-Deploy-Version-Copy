import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  PortalNavItem,
  PortalShellComponent
} from '../../../shared/components/portal-shell/portal-shell.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, PortalShellComponent],
  template: `
  <app-portal-shell
    portalLabel="Admin Panel"
    brandIcon="settings"
    role="admin"
    [navItems]="navItems">
    <router-outlet />
  </app-portal-shell>`
})
export class AdminLayoutComponent {
  readonly navItems: PortalNavItem[] = [
    { label: 'Dashboard', link: 'dashboard', icon: 'layout-dashboard' },
    { label: 'Students', link: 'students', icon: 'users' },
    { label: 'Faculty', link: 'teachers', icon: 'graduation-cap' },
    { label: 'Courses', link: 'courses', icon: 'book-open' },
    { label: 'Fee Management', link: 'fees', icon: 'credit-card' },
    { label: 'Semesters', link: 'semesters', icon: 'calendar' }
  ];
}
