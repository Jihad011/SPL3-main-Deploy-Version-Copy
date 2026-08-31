import { Component, EventEmitter, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { UserResponse, Page } from '../../../core/models/models';
import { GenericDataGrid } from '../../../shared/common-components/generic-component-type/generic-data-grid';
import { ExpansionSubPanelHeader } from '../../../shared/common-components/expansion-sub-panel-header/expansion-sub-panel-header';
import { ConfirmationDialogue } from '../../../shared/common-components/confirmation-dialogue/confirmation-dialogue';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-teacher-management-list',
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
        [subPanelTitle]="'Faculty Member Directory'"
      />

      <div *ngIf="listPanel()" style="margin-top: 0.5rem;">
        <generic-data-grid
          [dataSource]="teachers()"
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

    <!-- Confirmation Dialogue -->
    <confirmation-dialogue
      *ngIf="showDeleteConfirm()"
      [isOpen]="true"
      [title]="'Deactivate Faculty Account'"
      [message]="'Are you sure you want to deactivate faculty member ' + (deleteTarget()?.name || '') + '?'"
      variant="danger"
      (close)="showDeleteConfirm.set(false)"
      (buttonClick)="onDeleteConfirm($event)"
    />
  `,
  styles: [`
    .page-wrapper { width: 100%; min-width: 700px; }
  `]
})
export class TeacherManagementListComponent implements OnInit {
  @Output() modalResult = new EventEmitter<any>();

  teachers = signal<UserResponse[]>([]);
  listPanel = signal(true);
  showDeleteConfirm = signal(false);
  deleteTarget = signal<UserResponse | null>(null);

  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly selectedColumns = ['name', 'email', 'designation', 'phone', 'isActive'];
  readonly customColumnNames = {
    name: 'Faculty Name',
    email: 'Institutional Email',
    designation: 'Academic Designation',
    phone: 'Contact Phone',
    isActive: 'Account Status'
  };

  getActionVisibilityForRow = (row: any) => {
    return { edit: true, delete: true, view: true };
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.getAllTeachers(0, 200).subscribe({
      next: (res: Page<UserResponse>) => this.teachers.set(res.content),
      error: () => this.toast.error('Failed to load faculty list.')
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
      this.teachers.set(this.teachers().filter(t => t.id !== target.id));
      this.toast.success(`Faculty ${target.name} deactivated.`);
      this.showDeleteConfirm.set(false);
      this.deleteTarget.set(null);
    } else {
      this.showDeleteConfirm.set(false);
      this.deleteTarget.set(null);
    }
  }
}
