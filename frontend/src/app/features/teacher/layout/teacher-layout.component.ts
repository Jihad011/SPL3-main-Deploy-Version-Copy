import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  PortalNavItem,
  PortalShellComponent
} from '../../../shared/components/portal-shell/portal-shell.component';

@Component({
  selector: 'app-teacher-layout',
  standalone: true,
  imports: [RouterOutlet, PortalShellComponent],
  template: `
  <app-portal-shell
    portalLabel="Teacher Portal"
    brandIcon="clipboard"
    role="teacher"
    [navItems]="navItems">
    <router-outlet />
  </app-portal-shell>`
})
export class TeacherLayoutComponent {
  readonly navItems: PortalNavItem[] = [
    { label: 'Dashboard', link: 'dashboard', icon: 'layout-dashboard' },
    { label: 'Enter Grades', link: 'grade-entry', icon: 'list-check' },
    { label: 'Student History', link: 'student-history', icon: 'history' }
  ];
}
