import { Component, OnInit, OnDestroy, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UserResponse } from '../../../core/models/models';
import { ToastService } from '../../../core/services/toast.service';

// CenterPoint Shared Controls & Layouts
import {
  ExpansionPanelHeader,
  InputTextBox,
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

import { TeacherManagementListComponent } from './teacher-management-list.component';

@Component({
  selector: 'app-teacher-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ExpansionPanelHeader,
    InputTextBox,
    GenericSwitch,
    GenericModal,
    GenericButton,
    TeacherManagementListComponent
  ],
  template: `
<div class="page-wrapper">
  <!-- CenterPoint Panel Form Container -->
  <div class="panel">
    <div class="transaction-grid-container">
      <section class="header-section">
        <app-expansion-panel-header
          [isOpenSignal]="teacherSetupPanel"
          [panelTitle]="isEdit ? 'Update Faculty Profile' : 'Register New Faculty Member'"
        />

        <div *ngIf="teacherSetupPanel()" style="padding: 1.25rem 0.5rem;">
          <form [formGroup]="frmGroup" class="form-grid-appraisal">
            <div class="grid-row-2">
              <input-text-box
                [frmGroup]="frmGroup"
                controlName="name"
                label="Full Legal Name *"
                placeholder="e.g. Dr. Kazi Sakib"
                displayMode="vertical"
              />

              <input-text-box
                [frmGroup]="frmGroup"
                controlName="email"
                label="Institutional Email *"
                placeholder="e.g. sakib@iit.du.ac.bd"
                type="email"
                displayMode="vertical"
              />
            </div>

            <div class="grid-row-3" style="margin-top: 1rem;">
              <input-text-box
                [frmGroup]="frmGroup"
                controlName="designation"
                label="Academic Designation *"
                placeholder="e.g. Professor / Associate Professor"
                displayMode="vertical"
              />

              <input-text-box
                [frmGroup]="frmGroup"
                controlName="phone"
                label="Contact Number"
                placeholder="e.g. +880 1711 000000"
                displayMode="vertical"
              />

              <input-text-box
                *ngIf="!isEdit"
                [frmGroup]="frmGroup"
                controlName="password"
                label="Initial Password (min 6 chars) *"
                placeholder="••••••••"
                type="password"
                displayMode="vertical"
              />
            </div>
          </form>
        </div>
      </section>
    </div>
  </div>

  <!-- CenterPoint Generic Modal for Faculty List Grid -->
  <generic-modal
    [isVisible]="isModalShow"
    modalTitle="Faculty Member Directory"
    [cssClass]="'modal-xl'"
    (isVisibleChanged)="isModalShow = $event"
    (modalClosed)="isModalShow = false"
    [showDefaultFooter]="false"
  >
    <app-teacher-management-list
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
    .grid-row-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }
  `]
})
export class TeacherManagementComponent implements OnInit, OnDestroy {
  teacherSetupPanel = signal(true);
  isModalShow = false;
  isEdit = false;
  editTeacherId: number | null = null;

  frmGroup: FormGroup;

  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  constructor() {
    this.frmGroup = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      designation: ['Professor', Validators.required],
      phone: [''],
      password: ['123456', [Validators.required, Validators.minLength(6)]]
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

    this.api.createTeacher(this.frmGroup.value).subscribe({
      next: (res) => {
        this.toast.success(`Faculty member ${res.name} registered successfully!`);
        this.resetForm();
      },
      error: (err) => {
        const msg = err.error?.detail || err.error?.message || 'Failed to register faculty.';
        this.toast.error(msg);
      }
    });
  }

  submitUpdate(): void {
    if (this.frmGroup.invalid) {
      this.frmGroup.markAllAsTouched();
      return;
    }
    this.toast.success('Faculty profile updated.');
    this.resetForm();
  }

  resetForm(): void {
    this.isEdit = false;
    this.editTeacherId = null;
    this.frmGroup.reset({
      designation: 'Professor',
      password: 'password123'
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
      const t: UserResponse = result.data;
      if (result.isEdit) {
        this.isEdit = true;
        this.editTeacherId = t.id;
        this.frmGroup.patchValue({
          name: t.name,
          email: t.email,
          designation: t.designation || 'Faculty Member',
          phone: t.phone
        });
        ButtonUtils.setPageButtons({
          save: false,
          update: true,
          view: true,
          reset: true,
          exit: true
        });
        this.isModalShow = false;
        this.toast.info(`Editing faculty: ${t.name}`);
      } else if (result.viewMode) {
        this.isModalShow = false;
      }
    }
  }
}
