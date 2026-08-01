import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  PortalNavItem,
  PortalShellComponent
} from '../../../shared/components/portal-shell/portal-shell.component';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [RouterOutlet, PortalShellComponent],
  template: `
  <app-portal-shell
    portalLabel="Student Portal"
    brandIcon="graduation-cap"
    role="student"
    [navItems]="navItems">
    <router-outlet />
  </app-portal-shell>
  `
})
export class StudentLayoutComponent {
  readonly navItems: PortalNavItem[] = [
    { label: 'Dashboard', link: 'dashboard', icon: 'layout-dashboard' },
    { label: 'Course Registration', link: 'courses', icon: 'book-open' },
    { label: 'My Course(s)', link: 'my-courses', icon: 'list-check' },
    { label: 'My Results', link: 'results', icon: 'chart' },
    { label: 'Fees & Dues', link: 'dues', icon: 'credit-card' }
  ];
}
