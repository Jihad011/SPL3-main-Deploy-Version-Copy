import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UserResponse } from '../../../core/models/models';
import { ToastService } from '../../../core/services/toast.service';

// CenterPoint Shared Controls & Layouts
import {
  ExpansionPanelHeader,
  InputTextBox,
  InputNumber,
  GenericSwitch,
  GenericModal,
  GenericButton
} from '../../../shared';

import {
  ButtonUtils,
  ONCLICK_SAVE,
  ONCLICK_UPDATE,
  ONCLICK_RESET,
  ONCLICK_VIEW
} from '../../../shared/constant/button-signals.constant';

import { StudentManagementListComponent } from './student-management-list.component';

@Component({
  selector: 'app-student-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ExpansionPanelHeader,
    InputTextBox,
    InputNumber,
    GenericSwitch,
    GenericModal,
    GenericButton,
    StudentManagementListComponent
  ],
  template: `
<div class="page-wrapper">
  <!-- CenterPoint Panel Form Container -->
  <div class="panel">
    <div class="transaction-grid-container">
      <section class="header-section">
        <app-expansion-panel-header
          [isOpenSignal]="studentSetupPanel"
          [panelTitle]="isEdit ? 'Update Student Profile' : 'Register New Student Profile'"
        />

        <div *ngIf="studentSetupPanel()" style="padding: 1.25rem 0.5rem;">
          <form [formGroup]="frmGroup" class="form-grid-appraisal">
            <div class="grid-row-4">
              <input-text-box
                [frmGroup]="frmGroup"
                controlName="name"
                label="Full Legal Name"
                placeholder="e.g. Md. Jihad Hossain"
                displayMode="vertical"
              />

              <input-text-box
                [frmGroup]="frmGroup"
                controlName="email"
                label="Institutional Email"
                placeholder="e.g. jihad@iit.du.ac.bd"
                type="email"
                displayMode="vertical"
              />

              <input-text-box
                [frmGroup]="frmGroup"
                controlName="rollNumber"
                label="Academic Roll Number"
                placeholder="e.g. 1413 / BSSE1413"
                displayMode="vertical"
              />

              <input-number
                [frmGroup]="frmGroup"
                controlName="batch"
                label="Graduation Batch"
                placeholder="2021"
                [minValue]="2015"
                [maxValue]="2035"
                displayMode="vertical"
              />
            </div>

            <div class="grid-row-3" style="margin-top: 1rem;">
              <input-text-box
                [frmGroup]="frmGroup"
                controlName="registrationNumber"
                label="University Registration Number"
                placeholder="e.g. REG-2021-1413"
                displayMode="vertical"
              />

              <input-text-box
                [frmGroup]="frmGroup"
                controlName="phone"
                label="Contact Mobile"
                placeholder="e.g. +880 1700 000000"
                displayMode="vertical"
              />

              <input-text-box
                *ngIf="!isEdit"
                [frmGroup]="frmGroup"
                controlName="password"
                label="Initial Password (min 6 characters)"
                placeholder="••••••••"
                type="password"
                displayMode="vertical"
              />
            </div>

            <div style="margin-top: 1.25rem;">
              <generic-switch
                [frmGroup]="frmGroup"
                controlName="isActive"
                label="Active Account Status"
                displayMode="horizontal"
              />
            </div>
          </form>
        </div>
      </section>
    </div>
  </div>

  <!-- CenterPoint Generic Modal for Student List Grid -->
  <generic-modal
    [isVisible]="isModalShow"
    modalTitle="Student Directory Records"
    [cssClass]="'modal-xl'"
    (isVisibleChanged)="isModalShow = $event"
    (modalClosed)="isModalShow = false"
    [showDefaultFooter]="false"
  >
    <app-student-management-list
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
    .grid-row-4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }
    .grid-row-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }
  `]
})
export class StudentManagementComponent implements OnInit, OnDestroy {
  studentSetupPanel = signal(true);
  isModalShow = false;
  isEdit = false;
  editStudentId: number | null = null;

  frmGroup: FormGroup;

  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  constructor() {
    this.frmGroup = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      rollNumber: ['', [Validators.required, Validators.minLength(2)]],
      batch: [2021, [Validators.required, Validators.min(2015), Validators.max(2035)]],
      registrationNumber: [''],
      phone: [''],
      password: ['123456', [Validators.required, Validators.minLength(6)]],
      isActive: [true]
    });

    // Wire up Navbar Action signals
    effect(() => {
      if (ONCLICK_SAVE()) {
        this.submitSave();
        ONCLICK_SAVE.set(false);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      if (ONCLICK_UPDATE()) {
        this.submitUpdate();
        ONCLICK_UPDATE.set(false);
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
    // Configure top navbar action buttons
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

    this.api.createStudent(this.frmGroup.value).subscribe({
      next: (res) => {
        this.toast.success(`Student ${res.name} registered successfully!`);
        this.resetForm();
      },
      error: (err) => {
        const msg = err.error?.detail || err.error?.message || 'Failed to register student.';
        this.toast.error(msg);
      }
    });
  }

  submitUpdate(): void {
    if (this.frmGroup.invalid) {
      this.frmGroup.markAllAsTouched();
      return;
    }
    this.toast.success('Student profile updated.');
    this.resetForm();
  }

  resetForm(): void {
    this.isEdit = false;
    this.editStudentId = null;
    this.frmGroup.reset({
      batch: 2021,
      password: 'password123',
      isActive: true
    });
    ButtonUtils.setPageButtons({
      save: true,
      update: false,
      view: true,
      reset: true,
      exit: true
    });
  }

  onModalResult(result: any): void {
    if (result.data) {
      const s: UserResponse = result.data;
      if (result.isEdit) {
        this.isEdit = true;
        this.editStudentId = s.id;
        this.frmGroup.patchValue({
          name: s.name,
          email: s.email,
          rollNumber: s.rollNumber,
          batch: s.batch,
          registrationNumber: s.registrationNumber,
          phone: s.phone,
          isActive: s.isActive
        });
        ButtonUtils.setPageButtons({
          save: false,
          update: true,
          view: true,
          reset: true,
          exit: true
        });
        this.isModalShow = false;
        this.toast.info(`Editing student: ${s.name}`);
      } else if (result.viewMode) {
        this.isModalShow = false;
      }
    }
  }
}
