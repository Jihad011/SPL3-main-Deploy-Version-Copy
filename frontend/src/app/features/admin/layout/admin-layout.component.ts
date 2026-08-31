import { Component } from '@angular/core';
import { LayoutComponent } from '../../../layout/layout';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [LayoutComponent],
  template: `<app-layout></app-layout>`
})
export class AdminLayoutComponent {}
