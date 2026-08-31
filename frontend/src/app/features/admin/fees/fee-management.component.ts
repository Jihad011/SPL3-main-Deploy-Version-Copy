import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UserResponse, SemesterResponse, FeeCreateRequest } from '../../../core/models/models';
import { ToastService } from '../../../core/services/toast.service';

// CenterPoint Shared Controls & Layouts
import {
  ExpansionPanelHeader,
  InputSelectOptionField,
  InputAmount,
  InputAmountInWord,
  InputDate,
  InputTextBox,
  GenericModal,
  GenericButton,
  SelectOptionsModel,
  IconComponent
} from '../../../shared';

import {
  ButtonUtils,
  ONCLICK_SAVE,
  ONCLICK_RESET,
  ONCLICK_VIEW
} from '../../../shared/constant/button-signals.constant';

import { FeeManagementListComponent } from './fee-management-list.component';

@Component({
  selector: 'app-fee-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ExpansionPanelHeader,
    InputSelectOptionField,
    InputAmount,
    InputAmountInWord,
    InputDate,
    InputTextBox,
    GenericModal,
    GenericButton,
    IconComponent,
    FeeManagementListComponent
  ],
  template: `
<div class="page-wrapper">
  <!-- CenterPoint Panel Form Container -->
  <div class="panel">
    <div class="transaction-grid-container">
      <section class="header-section">
        <app-expansion-panel-header
          [isOpenSignal]="feeSetupPanel"
          [panelTitle]="'Issue Student Fee Invoice & Assessment Demand'"
        />

        <div *ngIf="feeSetupPanel()" style="padding: 1.25rem 0.5rem 0.5rem 0.5rem;">
          <form [formGroup]="frmGroup" class="form-grid-appraisal">
            <!-- Row 1: Core Invoice Specifications -->
            <div class="grid-row-3">
              <input-select-option-field
                [frmGroup]="frmGroup"
                controlName="studentId"
                label="Target Student"
                [options]="studentOptions()"
                displayMode="vertical"
              />

              <input-select-option-field
                [frmGroup]="frmGroup"
                controlName="feeType"
                label="Fee Classification"
                [options]="feeTypeOptions"
                displayMode="vertical"
              />

              <input-amount-in-word
                [frmGroup]="frmGroup"
                controlName="amount"
                label="Invoice Amount"
                currency="BDT"
                displayMode="vertical"
              />
            </div>

            <!-- Row 2: Term, Due Date & Remarks -->
            <div class="grid-row-3" style="margin-top: 1rem;">
              <input-select-option-field
                [frmGroup]="frmGroup"
                controlName="semesterId"
                label="Academic Semester"
                [options]="semesterOptions()"
                displayMode="vertical"
              />

              <input-date
                [frmGroup]="frmGroup"
                controlName="dueDate"
                label="Payment Due Date"
                dateFormat="YYYY-MM-DD"
                displayMode="vertical"
              />

              <input-text-box
                [frmGroup]="frmGroup"
                controlName="description"
                label="Invoice Remarks / Reference"
                placeholder="e.g. Assessment fee for course retake or term gap"
                displayMode="vertical"
              />
            </div>

            <!-- Automated System Assessment Tool Banner -->
            <div class="utility-card-banner">
              <div class="utility-banner-left">
                <div class="utility-icon-box">
                  <app-icon name="calendar" [size]="20"></app-icon>
                </div>
                <div>
                  <div class="utility-title">Automated Semester Gap Assessment</div>
                  <div class="utility-desc">Scan student academic progression histories and calculate unassessed semester gap penalty invoices.</div>
                </div>
              </div>
              <div class="utility-banner-right">
                <generic-button
                  label="Audit Gap Fines"
                  icon="calendar"
                  styles="background: #ffffff; color: var(--theme-primary, #086AD8); border: 1px solid #cbd5e1; font-weight: 600;"
                  (onClick)="auditGapFines()"
                />
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  </div>

  <!-- CenterPoint Generic Modal for Fee List Grid -->
  <generic-modal
    [isVisible]="isModalShow"
    modalTitle="Student Fee Invoices & Records"
    [cssClass]="'modal-xl'"
    (isVisibleChanged)="isModalShow = $event"
    (modalClosed)="isModalShow = false"
    [showDefaultFooter]="false"
  >
    <app-fee-management-list
      (modalResult)="onModalResult($event)"
    />
  </generic-modal>
</div>
  `,
  styles: [`
    .page-wrapper {
      max-width: 1300px;
      margin: 0 auto;
    }
    .panel {
      background: var(--bg-card, #ffffff);
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .grid-row-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
    }
    .utility-card-banner {
      margin-top: 1.5rem;
      padding: 1rem 1.25rem;
      background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
      border: 1px solid #bfdbfe;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .utility-banner-left {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      min-width: 260px;
    }
    .utility-icon-box {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background: #dbeafe;
      color: #1d4ed8;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .utility-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: #1e3a8a;
      line-height: 1.2;
    }
    .utility-desc {
      font-size: 0.75rem;
      color: #475569;
      margin-top: 0.2rem;
    }
    .utility-banner-right {
      flex-shrink: 0;
    }
  `]
})
export class FeeManagementComponent implements OnInit, OnDestroy {
  feeSetupPanel = signal(true);
  isModalShow = false;

  students = signal<UserResponse[]>([]);
  semesters = signal<SemesterResponse[]>([]);

  frmGroup: FormGroup;

  readonly feeTypeOptions: SelectOptionsModel[] = [
    { key: 'REGISTRATION', value: 'Registration Fee' },
    { key: 'RETAKE', value: 'Course Retake Fee' },
    { key: 'SEMESTER_GAP', value: 'Semester Gap Penalty' },
    { key: 'OTHER', value: 'General Academic Dues' }
  ];

  studentOptions = computed<SelectOptionsModel[]>(() => [
    { key: null, value: 'Select Student...' },
    ...this.students().map(s => ({
      key: s.id,
      value: `${s.name} (${s.rollNumber || 'No Roll'})`
    }))
  ]);

  semesterOptions = computed<SelectOptionsModel[]>(() => [
    { key: null, value: 'None (General Term)' },
    ...this.semesters().map(sem => ({
      key: sem.id,
      value: `${sem.label}`
    }))
  ]);

  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  constructor() {
    this.frmGroup = this.fb.group({
      studentId: [null, Validators.required],
      feeType: ['REGISTRATION', Validators.required],
      amount: [2500, [Validators.required, Validators.min(100)]],
      semesterId: [null],
      dueDate: [''],
      description: ['']
    });

    // Wire up Navbar Action signals
    effect(() => {
      if (ONCLICK_SAVE()) {
        this.submitSave();
        ONCLICK_SAVE.set(false);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      if (ONCLICK_RESET()) {
        this.resetForm();
        ONCLICK_RESET.set(false);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      if (ONCLICK_VIEW()) {
        this.isModalShow = true;
        ONCLICK_VIEW.set(false);
      }
    }, { allowSignalWrites: true });

  }

  ngOnInit(): void {
    ButtonUtils.setPageButtons({
      save: true,
      update: false,
      view: true,
      reset: true,
      exit: true
    });
    this.loadMetadata();
  }

  ngOnDestroy(): void {
    ButtonUtils.resetAll();
  }

  loadMetadata(): void {
    this.api.getAllStudents(0, 500).subscribe({
      next: (res) => this.students.set(res.content),
      error: () => {}
    });

    this.api.getAllSemesters().subscribe({
      next: (data) => this.semesters.set(data),
      error: () => {}
    });
  }

  submitSave(): void {
    if (this.frmGroup.invalid) {
      this.frmGroup.markAllAsTouched();
      this.toast.error('Please complete all required fields.');
      return;
    }

    const req: FeeCreateRequest = this.frmGroup.value;
    this.api.createFee(req).subscribe({
      next: () => {
        this.toast.success('Student fee invoice issued successfully!');
        this.resetForm();
      },
      error: (err) => {
        const msg = err.error?.detail || err.error?.message || 'Failed to issue fee invoice.';
        this.toast.error(msg);
      }
    });
  }

  auditGapFines(): void {
    this.api.auditGapFines().subscribe({
      next: (fines) => {
        this.toast.success(`Gap fine audit complete: ${fines.length} penalty records processed.`);
      },
      error: () => this.toast.error('Gap fine audit encountered an error.')
    });
  }

  resetForm(): void {
    this.frmGroup.reset({
      studentId: null,
      feeType: 'REGISTRATION',
      amount: 2500,
      semesterId: null,
      dueDate: '',
      description: ''
    });
  }

  onModalResult(result: any): void {
    if (result.data) {
      this.isModalShow = false;
    }
  }
}
