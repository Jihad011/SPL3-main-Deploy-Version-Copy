import { Component, EventEmitter, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { CourseResponse } from '../../../core/models/models';
import { GenericDataGrid } from '../../../shared/common-components/generic-component-type/generic-data-grid';
import { ExpansionSubPanelHeader } from '../../../shared/common-components/expansion-sub-panel-header/expansion-sub-panel-header';
import { ConfirmationDialogue } from '../../../shared/common-components/confirmation-dialogue/confirmation-dialogue';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-course-management-list',
  standalone: true,
  imports: [
    CommonModule,
    GenericDataGrid,
    ExpansionSubPanelHeader,
    ConfirmationDialogue
  ],
  template: `
    <div class="page-wrapper" style="padding: 0.5rem;">
      <app-expansion-sub-panel-header
        [isOpenSignal]="listPanel"
        [subPanelTitle]="'Course Catalog Offerings'"
      />

      <div *ngIf="listPanel()" style="margin-top: 0.5rem;">
        <generic-data-grid
          [dataSource]="courses()"
          [selectedColumns]="selectedColumns"
          [customColumnNames]="customColumnNames"
          [actionVisibility]="getActionVisibilityForRow"
          [showEditButton]="true"
          [showDeleteButton]="true"
          [showViewButton]="true"
          [searchEnabled]="true"
          [useInlineEdit]="false"
          (onFHViewClick)="onViewClick($event)"
          (onFHEditClick)="onEditClick($event)"
          (onFHDeleteClick)="onDeleteClick($event)"
        />
      </div>
    </div>

    <!-- Deactivate Safety Confirmation -->
    <confirmation-dialogue
      *ngIf="showDeleteConfirm()"
      [isOpen]="true"
      [title]="'Deactivate Academic Course'"
      [message]="'Are you sure you want to deactivate course ' + (deleteTarget()?.code || '') + ' — ' + (deleteTarget()?.name || '') + '?'"
      variant="danger"
      (close)="showDeleteConfirm.set(false)"
      (buttonClick)="onDeleteConfirm($event)"
    />
  `,
  styles: [`
    .page-wrapper { width: 100%; min-width: 700px; }
  `]
})
export class CourseManagementListComponent implements OnInit {
  @Output() modalResult = new EventEmitter<any>();

  courses = signal<CourseResponse[]>([]);
  listPanel = signal(true);
  showDeleteConfirm = signal(false);
  deleteTarget = signal<CourseResponse | null>(null);

  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly selectedColumns = ['code', 'name', 'creditHours', 'courseType', 'currentEnrollment', 'maxSeats', 'teacherName', 'isActive'];
  readonly customColumnNames = {
    code: 'Course Code',
    name: 'Course Title',
    creditHours: 'Credits',
    courseType: 'Course Type',
    currentEnrollment: 'Enrolled Seats',
    maxSeats: 'Capacity Limit',
    teacherName: 'Lead Faculty',
    isActive: 'Status'
  };

  getActionVisibilityForRow = (row: any) => {
    return { edit: true, delete: true, view: true };
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.getAllCourses().subscribe({
      next: (data: CourseResponse[]) => this.courses.set(data),
      error: () => this.toast.error('Failed to load courses.')
    });
  }

  onViewClick(itemJson: any): void {
    const element = typeof itemJson === 'string' ? JSON.parse(itemJson) : itemJson;
    if (this.modalResult.observed) {
      this.modalResult.emit({ data: element, viewMode: true });
    }
  }

  onEditClick(itemJson: any): void {
    const element = typeof itemJson === 'string' ? JSON.parse(itemJson) : itemJson;
    if (this.modalResult.observed) {
      this.modalResult.emit({ data: element, isEdit: true });
    }
  }

  onDeleteClick(itemJson: any): void {
    const element = typeof itemJson === 'string' ? JSON.parse(itemJson) : itemJson;
    this.deleteTarget.set(element);
    this.showDeleteConfirm.set(true);
  }

  onDeleteConfirm(event: any): void {
    if (event.action === 'confirm' && this.deleteTarget()) {
      const target = this.deleteTarget()!;
      this.api.deactivateCourse(target.id).subscribe({
        next: () => {
          this.courses.set(this.courses().filter(c => c.id !== target.id));
          this.toast.success(`Course ${target.code} deactivated.`);
          this.showDeleteConfirm.set(false);
          this.deleteTarget.set(null);
        },
        error: () => this.toast.error('Failed to deactivate course.')
      });
    } else {
      this.showDeleteConfirm.set(false);
      this.deleteTarget.set(null);
    }
  }
}
