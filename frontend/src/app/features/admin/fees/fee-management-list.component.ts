import { Component, EventEmitter, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { FeeResponse } from '../../../core/models/models';
import { GenericDataGrid } from '../../../shared/common-components/generic-component-type/generic-data-grid';
import { ExpansionSubPanelHeader } from '../../../shared/common-components/expansion-sub-panel-header/expansion-sub-panel-header';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-fee-management-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
    GenericDataGrid,
    ExpansionSubPanelHeader
  ],
  template: `
    <div class="page-wrapper" style="padding: 0.5rem;">
      <app-expansion-sub-panel-header
        [isOpenSignal]="listPanel"
        [subPanelTitle]="'Student Fee Invoices & Audit Ledgers'"
      />

      <div *ngIf="listPanel()" style="margin-top: 0.5rem;">
        <generic-data-grid
          [dataSource]="fees()"
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
export class FeeManagementListComponent implements OnInit {
  @Output() modalResult = new EventEmitter<any>();

  fees = signal<FeeResponse[]>([]);
  listPanel = signal(true);

  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly selectedColumns = ['studentName', 'rollNumber', 'feeTypeDisplay', 'amount', 'status', 'dueDate', 'createdAt'];
  readonly customColumnNames = {
    studentName: 'Student Name',
    rollNumber: 'Roll No.',
    feeTypeDisplay: 'Fee Type',
    amount: 'Amount (BDT)',
    status: 'Payment Status',
    dueDate: 'Due Date',
    createdAt: 'Issued On'
  };

  getActionVisibilityForRow = (row: any) => {
    return { edit: false, delete: false, view: true };
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.getAllFees().subscribe({
      next: (data: FeeResponse[]) => this.fees.set(data),
      error: () => this.toast.error('Failed to load fee records.')
    });
  }

  onViewClick(itemJson: any): void {
    const element = typeof itemJson === 'string' ? JSON.parse(itemJson) : itemJson;
    if (this.modalResult.observed) {
      this.modalResult.emit({ data: element, viewMode: true });
    }
  }
}
