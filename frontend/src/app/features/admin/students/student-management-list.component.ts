import { Component, EventEmitter, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { UserResponse, Page } from '../../../core/models/models';
import { GenericDataGrid } from '../../../shared/common-components/generic-component-type/generic-data-grid';
import { ExpansionSubPanelHeader } from '../../../shared/common-components/expansion-sub-panel-header/expansion-sub-panel-header';
import { ConfirmationDialogue } from '../../../shared/common-components/confirmation-dialogue/confirmation-dialogue';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-student-management-list',
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
        [subPanelTitle]="'Student Directory Records'"
      />

      <div *ngIf="listPanel()" style="margin-top: 0.5rem;">
        <generic-data-grid
          [dataSource]="students()"
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

    <!-- Delete Confirmation Dialogue -->
    <confirmation-dialogue
      *ngIf="showDeleteConfirm()"
      [isOpen]="true"
      [title]="'Deactivate Student Account'"
      [message]="'Are you sure you want to deactivate student ' + (deleteTarget()?.name || '') + ' (' + (deleteTarget()?.rollNumber || '') + ')?'"
      variant="danger"
      (close)="showDeleteConfirm.set(false)"
      (buttonClick)="onDeleteConfirm($event)"
    />
  `,
  styles: [`
    .page-wrapper { width: 100%; min-width: 700px; }
  `]
})
export class StudentManagementListComponent implements OnInit {
  @Output() modalResult = new EventEmitter<any>();

  students = signal<UserResponse[]>([]);
  listPanel = signal(true);
  showDeleteConfirm = signal(false);
  deleteTarget = signal<UserResponse | null>(null);

  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly selectedColumns = ['rollNumber', 'name', 'batch', 'registrationNumber', 'email', 'phone', 'isActive'];
  readonly customColumnNames = {
    rollNumber: 'Roll No.',
    name: 'Student Name',
    batch: 'Batch',
    registrationNumber: 'Registration No.',
    email: 'Institutional Email',
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
    this.api.getAllStudents(0, 200).subscribe({
      next: (page: Page<UserResponse>) => this.students.set(page.content),
      error: () => this.toast.error('Failed to load student list.')
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
      this.students.set(this.students().filter(s => s.id !== target.id));
      this.toast.success(`Student ${target.name} deactivated.`);
      this.showDeleteConfirm.set(false);
      this.deleteTarget.set(null);
    } else {
      this.showDeleteConfirm.set(false);
      this.deleteTarget.set(null);
    }
  }
}
