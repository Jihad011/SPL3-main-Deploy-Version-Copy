import { Component, EventEmitter, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { SemesterResponse } from '../../../core/models/models';
import { GenericDataGrid } from '../../../shared/common-components/generic-component-type/generic-data-grid';
import { ExpansionSubPanelHeader } from '../../../shared/common-components/expansion-sub-panel-header/expansion-sub-panel-header';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-semester-management-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    GenericDataGrid,
    ExpansionSubPanelHeader
  ],
  template: `
    <div class="page-wrapper" style="padding: 0.5rem;">
      <app-expansion-sub-panel-header
        [isOpenSignal]="listPanel"
        [subPanelTitle]="'Academic Semester Sessions'"
      />

      <div *ngIf="listPanel()" style="margin-top: 0.5rem;">
        <generic-data-grid
          [dataSource]="semesters()"
          [selectedColumns]="selectedColumns"
          [customColumnNames]="customColumnNames"
          [actionVisibility]="getActionVisibilityForRow"
          [showEditButton]="false"
          [showDeleteButton]="false"
          [showViewButton]="true"
          [searchEnabled]="true"
          [useInlineEdit]="false"
          (onFHViewClick)="onViewClick($event)"
        />
      </div>
    </div>
  `,
  styles: [`
    .page-wrapper { width: 100%; min-width: 700px; }
  `]
})
export class SemesterManagementListComponent implements OnInit {
  @Output() modalResult = new EventEmitter<any>();

  semesters = signal<SemesterResponse[]>([]);
  listPanel = signal(true);

  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly selectedColumns = ['label', 'name', 'year', 'startDate', 'endDate', 'isActive'];
  readonly customColumnNames = {
    label: 'Semester Session',
    name: 'Term Code',
    year: 'Academic Year',
    startDate: 'Session Start',
    endDate: 'Session End',
    isActive: 'Enrollment Open'
  };

  getActionVisibilityForRow = (row: any) => {
    return { edit: false, delete: false, view: true };
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.getAllSemesters().subscribe({
      next: (data: SemesterResponse[]) => this.semesters.set(data),
      error: () => this.toast.error('Failed to load semesters.')
    });
  }

  onViewClick(itemJson: any): void {
    const element = typeof itemJson === 'string' ? JSON.parse(itemJson) : itemJson;
    if (this.modalResult.observed) {
      this.modalResult.emit({ data: element, viewMode: true });
    }
  }
}
