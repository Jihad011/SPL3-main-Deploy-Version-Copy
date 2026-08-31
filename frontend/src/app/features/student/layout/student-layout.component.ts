import { Component } from '@angular/core';
import { LayoutComponent } from '../../../layout/layout';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [LayoutComponent],
  template: `<app-layout></app-layout>`
})
export class StudentLayoutComponent {}
