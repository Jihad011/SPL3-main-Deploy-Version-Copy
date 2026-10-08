import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { CourseResponse, CourseRequest, UserResponse } from '../../../core/models/models';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

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
    IconComponent,
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
                placeholder="e.g. MITM 303"
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

            <!-- Textual Syllabus / Learning Outcomes -->
            <div style="margin-top: 1rem;">
              <input-text-area
                [frmGroup]="frmGroup"
                controlName="description"
                label="Course Syllabus & Learning Outcomes (Textual Description)"
                placeholder="Describe course objectives, prerequisites, topics, and evaluation scheme..."
                [rows]="4"
                displayMode="vertical"
              />
            </div>

            <!-- Faculty Attached Syllabus Document Preview for Admin -->
            <div class="attached-file-card" *ngIf="frmGroup.get('syllabusUrl')?.value" style="margin-top: 1rem; padding: 0.85rem 1rem; background: var(--bg-elevated, #f8fafc); border: 1px solid var(--border, #cbd5e1); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <app-icon name="file-text" [size]="22" style="color: var(--accent-primary, #2563eb);"></app-icon>
                <div>
                  <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary, #1e293b);">
                    {{ frmGroup.get('syllabusFileName')?.value || 'Official_Course_Syllabus.pdf' }}
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary, #64748b);">
                    Faculty Syllabus File Uploaded & Attached
                  </div>
                </div>
              </div>
              <a [href]="getSyllabusFullUrl(frmGroup.get('syllabusUrl')?.value)" target="_blank" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.85rem; font-size: 0.8rem; font-weight: 600;">
                <app-icon name="eye" [size]="14"></app-icon> View Faculty Syllabus Document
              </a>
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
    .syllabus-upload-zone {
      margin-top: 1rem;
      background: var(--bg-elevated, #f8fafc);
      border: 1.5px dashed var(--border, #cbd5e1);
      border-radius: 10px;
      padding: 1.25rem;
    }
    .syllabus-upload-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary, #1e293b);
      margin-bottom: 0.5rem;
    }
    .file-upload-box {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .btn-upload-file {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 1.25rem;
      background: var(--accent-primary, #2563eb);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      width: fit-content;
      transition: all 0.2s;
    }
    .btn-upload-file:hover:not(:disabled) {
      background: #1d4ed8;
      transform: translateY(-1px);
    }
    .file-hint {
      font-size: 0.75rem;
      color: var(--text-muted, #64748b);
    }
    .attached-file-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-card, #ffffff);
      border: 1px solid rgba(37, 99, 235, 0.3);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .attached-file-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .file-icon {
      color: var(--accent-primary, #2563eb);
    }
    .file-details {
      display: flex;
      flex-direction: column;
    }
    .file-name {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-primary, #1e293b);
    }
    .file-status {
      font-size: 0.75rem;
      color: var(--accent-green, #10b981);
      font-weight: 600;
    }
    .attached-file-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-file-view {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      background: rgba(37, 99, 235, 0.1);
      color: var(--accent-primary, #2563eb);
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      text-decoration: none;
    }
    .btn-file-remove {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border: none;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }
    .spinner-sm {
      width: 14px;
      height: 14px;
      border: 2px solid white;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class CourseManagementComponent implements OnInit, OnDestroy {
  courseSetupPanel = signal(true);
  isModalShow = false;
  isEdit = false;
  editCourseId: number | null = null;
  teachers = signal<UserResponse[]>([]);
  uploadingSyllabus = signal(false);

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
      description: [''],
      syllabusUrl: [null],
      syllabusFileName: [null]
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.uploadingSyllabus.set(true);

    this.api.uploadSyllabusFile(file).subscribe({
      next: (res) => {
        this.uploadingSyllabus.set(false);
        this.frmGroup.patchValue({
          syllabusUrl: res.url,
          syllabusFileName: res.fileName
        });
        this.toast.success(`Attached syllabus file: ${res.fileName}`);
      },
      error: (err) => {
        this.uploadingSyllabus.set(false);
        const msg = err.error?.detail || err.error?.message || 'Failed to upload syllabus file.';
        this.toast.error(msg);
      }
    });
  }

  removeSyllabusFile(): void {
    this.frmGroup.patchValue({
      syllabusUrl: null,
      syllabusFileName: null
    });
    this.toast.info('Removed attached syllabus file.');
  }

  getSyllabusFullUrl(url: string | null): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url}`;
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
      teacherId: null,
      syllabusUrl: null,
      syllabusFileName: null
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
          description: c.description,
          syllabusUrl: c.syllabusUrl,
          syllabusFileName: c.syllabusFileName
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
