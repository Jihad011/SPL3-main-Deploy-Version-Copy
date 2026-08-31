import { Component, OnInit, OnDestroy, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

// CenterPoint Shared Controls & Layouts
import {
  ExpansionPanelHeader,
  InputSelectOptionField,
  InputNumber,
  InputDate,
  GenericSwitch,
  GenericModal,
  GenericButton,
  SelectOptionsModel
} from '../../../shared';

import {
  ButtonUtils,
  ONCLICK_SAVE,
  ONCLICK_RESET,
  ONCLICK_VIEW
} from '../../../shared/constant/button-signals.constant';

import { SemesterManagementListComponent } from './semester-management-list.component';

@Component({
  selector: 'app-semester-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ExpansionPanelHeader,
    InputSelectOptionField,
    InputNumber,
    InputDate,
    GenericSwitch,
    GenericModal,
    GenericButton,
    SemesterManagementListComponent
  ],
  template: `
<div class="page-wrapper">
  <!-- CenterPoint Panel Form Container -->
  <div class="panel">
    <div class="transaction-grid-container">
      <section class="header-section">
        <app-expansion-panel-header
          [isOpenSignal]="semSetupPanel"
          [panelTitle]="'Academic Semester Term Setup'"
        />

        <div *ngIf="semSetupPanel()" style="padding: 1.25rem 0.5rem;">
          <form [formGroup]="frmGroup" class="form-grid-appraisal">
            <div class="grid-row-2">
              <input-select-option-field
                [frmGroup]="frmGroup"
                controlName="name"
                label="Academic Term *"
                [options]="termOptions"
                displayMode="vertical"
              />

              <input-number
                [frmGroup]="frmGroup"
                controlName="year"
                label="Academic Year *"
                placeholder="2026"
                [minValue]="2020"
                [maxValue]="2035"
                displayMode="vertical"
              />
            </div>

            <div class="grid-row-2" style="margin-top: 1rem;">
              <input-date
                [frmGroup]="frmGroup"
                controlName="startDate"
                label="Term Start Date *"
                displayMode="vertical"
              />

              <input-date
                [frmGroup]="frmGroup"
                controlName="endDate"
                label="Term End Date *"
                displayMode="vertical"
              />
            </div>

            <div style="margin-top: 1rem;">
              <generic-switch
                [frmGroup]="frmGroup"
                controlName="isActive"
                label="Open Registration & Activate Term Immediately"
                displayMode="horizontal"
              />
            </div>
          </form>
        </div>
      </section>
    </div>
  </div>

  <!-- CenterPoint Generic Modal for Semester List Grid -->
  <generic-modal
    [isVisible]="isModalShow"
    modalTitle="Academic Semester Sessions"
    [cssClass]="'modal-xl'"
    (isVisibleChanged)="isModalShow = $event"
    (modalClosed)="isModalShow = false"
    [showDefaultFooter]="false"
  >
    <app-semester-management-list
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
    .grid-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
  `]
})
export class SemesterManagementComponent implements OnInit, OnDestroy {
  semSetupPanel = signal(true);
  isModalShow = false;

  frmGroup: FormGroup;

  readonly termOptions: SelectOptionsModel[] = [
    { key: 'SPRING', value: 'Spring Semester' },
    { key: 'SUMMER', value: 'Summer Semester' },
    { key: 'FALL', value: 'Fall Semester' }
  ];

  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  constructor() {
    this.frmGroup = this.fb.group({
      name: ['SPRING', Validators.required],
      year: [2026, [Validators.required, Validators.min(2020), Validators.max(2035)]],
      startDate: [new Date(), Validators.required],
      endDate: [new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), Validators.required],
      isActive: [false]
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
  }

  ngOnDestroy(): void {
    ButtonUtils.resetAll();
  }

  submitSave(): void {
    if (this.frmGroup.invalid) {
      this.frmGroup.markAllAsTouched();
      this.toast.error('Please complete all required fields.');
      return;
    }

    const val = this.frmGroup.value;
    const req = {
      name: val.name,
      year: val.year,
      startDate: val.startDate instanceof Date ? val.startDate.toISOString().split('T')[0] : val.startDate,
      endDate: val.endDate instanceof Date ? val.endDate.toISOString().split('T')[0] : val.endDate,
      isActive: val.isActive ?? false
    };

    this.api.createSemester(req).subscribe({
      next: (res) => {
        this.toast.success(`Semester ${res.label} configured successfully!`);
        this.resetForm();
      },
      error: (err) => {
        const msg = err.error?.detail || err.error?.message || 'Failed to create semester.';
        this.toast.error(msg);
      }
    });
  }

  resetForm(): void {
    this.frmGroup.reset({
      name: 'SPRING',
      year: 2026,
      startDate: new Date(),
      endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      isActive: false
    });
  }

  onModalResult(result: any): void {
    if (result.data) {
      this.isModalShow = false;
    }
  }
}
