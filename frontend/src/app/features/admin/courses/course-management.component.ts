import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { CourseResponse, CourseRequest, UserResponse } from '../../../core/models/models';
import { ToastService } from '../../../core/services/toast.service';

// CenterPoint Shared Controls & Layouts
import {
  ExpansionPanelHeader,
  InputTextBox,
  InputNumber,
  InputTextArea,
  InputSelectOptionField,
  GenericModal,
  GenericButton,
  SelectOptionsModel
} from '../../../shared';

import {
  ButtonUtils,
  ONCLICK_SAVE,
  ONCLICK_UPDATE,
  ONCLICK_RESET,
  ONCLICK_VIEW
} from '../../../shared/constant/button-signals.constant';

import { CourseManagementListComponent } from './course-management-list.component';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ExpansionPanelHeader,
    InputTextBox,
    InputNumber,
    InputTextArea,
    InputSelectOptionField,
    GenericModal,
    GenericButton,
    CourseManagementListComponent
  ],
  template: `
<div class="page-wrapper">
  <!-- CenterPoint Panel Form Container -->
  <div class="panel">
    <div class="transaction-grid-container">
      <section class="header-section">
        <app-expansion-panel-header
          [isOpenSignal]="courseSetupPanel"
          [panelTitle]="isEdit ? 'Update Course Offering' : 'Course Offering & Curriculum Setup'"
        />

        <div *ngIf="courseSetupPanel()" style="padding: 1.25rem 0.5rem;">
          <form [formGroup]="frmGroup" class="form-grid-appraisal">
            <div class="grid-row-3">
              <input-text-box
                [frmGroup]="frmGroup"
                controlName="code"
                label="Course Code"
                placeholder="e.g. MIT-501"
                displayMode="vertical"
              />

              <input-text-box
                [frmGroup]="frmGroup"
                controlName="name"
                label="Course Title"
                placeholder="e.g. Advanced Software Architecture"
                displayMode="vertical"
              />

              <input-select-option-field
                [frmGroup]="frmGroup"
                controlName="courseType"
                label="Course Classification"
                [options]="typeOptions"
                displayMode="vertical"
              />
            </div>

            <div class="grid-row-3" style="margin-top: 1rem;">
              <input-number
                [frmGroup]="frmGroup"
                controlName="creditHours"
                label="Credit Units"
                placeholder="3"
                [minValue]="1"
                [maxValue]="6"
                displayMode="vertical"
              />

              <input-number
                [frmGroup]="frmGroup"
                controlName="maxSeats"
                label="Max Student Capacity"
                placeholder="40"
                [minValue]="5"
                [maxValue]="200"
                displayMode="vertical"
              />

              <input-select-option-field
                [frmGroup]="frmGroup"
                controlName="teacherId"
                label="Assigned Lead Faculty"
                [options]="facultyOptions()"
                displayMode="vertical"
              />
            </div>

            <div style="margin-top: 1rem;">
              <input-text-area
                [frmGroup]="frmGroup"
                controlName="description"
                label="Course Syllabus & Learning Outcomes"
                placeholder="Describe course objectives, prerequisites, and evaluation scheme..."
                [rows]="3"
                displayMode="vertical"
              />
            </div>
          </form>
        </div>
      </section>
    </div>
  </div>

  <!-- CenterPoint Generic Modal for Course List Grid -->
  <generic-modal
    [isVisible]="isModalShow"
    modalTitle="Course Catalog Offerings"
    [cssClass]="'modal-xl'"
    (isVisibleChanged)="isModalShow = $event"
    (modalClosed)="isModalShow = false"
    [showDefaultFooter]="false"
  >
    <app-course-management-list
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
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
    }
  `]
})
export class CourseManagementComponent implements OnInit, OnDestroy {
  courseSetupPanel = signal(true);
  isModalShow = false;
  isEdit = false;
  editCourseId: number | null = null;
  teachers = signal<UserResponse[]>([]);

  frmGroup: FormGroup;

  readonly typeOptions: SelectOptionsModel[] = [
    { key: 'CORE', value: 'Core Course' },
    { key: 'OPTIONAL', value: 'Optional Course' }
  ];

  facultyOptions = computed<SelectOptionsModel[]>(() => [
    { key: null, value: 'None (Assign Later)' },
    ...this.teachers().map(t => ({
      key: t.id,
      value: `${t.name} (${t.designation || 'Faculty'})`
    }))
  ]);

  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  constructor() {
    this.frmGroup = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      creditHours: [3, [Validators.required, Validators.min(1), Validators.max(6)]],
      maxSeats: [40, [Validators.required, Validators.min(5), Validators.max(200)]],
      courseType: ['CORE', Validators.required],
      teacherId: [null],
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
    this.loadFaculty();
  }

  ngOnDestroy(): void {
    ButtonUtils.resetAll();
  }

  loadFaculty(): void {
    this.api.getAllTeachers(0, 100).subscribe({
      next: (res) => this.teachers.set(res.content),
      error: () => {}
    });
  }

  submitSave(): void {
    if (this.frmGroup.invalid) {
      this.frmGroup.markAllAsTouched();
      this.toast.error('Please complete all required fields.');
      return;
    }

    const req: CourseRequest = this.frmGroup.value;
    this.api.createCourse(req).subscribe({
      next: (res) => {
        this.toast.success(`Course ${res.code} created successfully!`);
        this.resetForm();
      },
      error: (err) => {
        const msg = err.error?.detail || err.error?.message || 'Failed to create course.';
        this.toast.error(msg);
      }
    });
  }

  submitUpdate(): void {
    if (this.frmGroup.invalid || !this.editCourseId) {
      this.frmGroup.markAllAsTouched();
      return;
    }
    const req: CourseRequest = this.frmGroup.value;
    this.api.updateCourse(this.editCourseId, req).subscribe({
      next: (res) => {
        this.toast.success(`Course ${res.code} updated successfully.`);
        this.resetForm();
      },
      error: (err) => {
        const msg = err.error?.detail || err.error?.message || 'Failed to update course.';
        this.toast.error(msg);
      }
    });
  }

  resetForm(): void {
    this.isEdit = false;
    this.editCourseId = null;
    this.frmGroup.reset({
      creditHours: 3,
      maxSeats: 40,
      courseType: 'CORE',
      teacherId: null
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
      const c: CourseResponse = result.data;
      if (result.isEdit) {
        this.isEdit = true;
        this.editCourseId = c.id;
        this.frmGroup.patchValue({
          code: c.code,
          name: c.name,
          creditHours: c.creditHours,
          maxSeats: c.maxSeats,
          courseType: c.courseType,
          teacherId: c.teacherId,
          description: c.description
        });
        ButtonUtils.setPageButtons({
          save: false,
          update: true,
          view: true,
          reset: true,
          exit: true
        });
        this.isModalShow = false;
        this.toast.info(`Editing course: ${c.code}`);
      } else if (result.viewMode) {
        this.isModalShow = false;
      }
    }
  }
}
