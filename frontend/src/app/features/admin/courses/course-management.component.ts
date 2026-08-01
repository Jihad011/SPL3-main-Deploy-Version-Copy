import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { CourseResponse, CourseRequest, UserResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IconComponent, ConfirmModalComponent],
  template: `
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-eyebrow">Academic catalog</div>
      <h1 class="page-title text-gradient-flow">Course Management</h1>
      <p class="page-subtitle">Create and manage course offerings</p>
    </div>
    <button class="btn btn-primary btn-neon" (click)="showForm.set(!showForm())">
      <app-icon [name]="showForm() ? 'x' : 'book-open'" [size]="17"></app-icon>
      {{ showForm() ? 'Cancel' : 'Add Course' }}
    </button>
  </div>

  <!-- Create Course Panel -->
  <div class="card form-panel card-glow-border" *ngIf="showForm()">
    <div class="card-header card-glow-border">
      <div class="card-title card-glow-border">Create New Course</div>
      <div class="card-sub card-glow-border">Fill in all required fields</div>
    </div>
    <div class="form-card card-glow-border">
      <div class="alert alert-error" *ngIf="formError()">
        <app-icon name="alert-triangle" [size]="18"></app-icon>{{ formError() }}
      </div>
      <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
        <div class="form-group">
          <label>Course Code</label>
          <input formControlName="code" placeholder="e.g. MIT-501" />
        </div>
        <div class="form-group">
          <label>Course Name</label>
          <input formControlName="name" placeholder="e.g. Software Engineering" />
        </div>
        <div class="form-group">
          <label>Credit Hours</label>
          <input formControlName="creditHours" type="number" min="1" max="6" />
        </div>
        <div class="form-group">
          <label>Course Type</label>
          <select formControlName="courseType">
            <option value="CORE">Core</option>
            <option value="OPTIONAL">Optional</option>
          </select>
        </div>
        <div class="form-group">
          <label>Max Seats</label>
          <input formControlName="maxSeats" type="number" placeholder="40" />
        </div>
        <div class="form-group">
          <label>Assign Teacher</label>
          <select formControlName="teacherId">
            <option [ngValue]="null">-- Select a Faculty Member --</option>
            <option *ngFor="let t of teachers()" [ngValue]="t.id">{{ t.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Description</label>
          <input formControlName="description" placeholder="Short course description (optional)" />
        </div>
        <div class="form-actions form-grid-wide">
          <button type="submit" class="btn btn-primary btn-neon" [disabled]="saving()">
            <span *ngIf="!saving()">Create Course</span>
            <span *ngIf="saving()" class="spinner-sm"></span>
          </button>
        </div>
      </form>
    </div>
  </div>

  <div class="spinner-wrapper" *ngIf="loading()"><div class="spinner"></div></div>

  <app-confirm-modal #confirmModal (confirm)="confirmDeactivate()" />

  <!-- Courses Table -->
  <div class="card card-glow-border" *ngIf="!loading()">
    <div class="card-header card-glow-border">
      <div>
        <div class="card-title card-glow-border">All Courses</div>
        <div class="card-sub card-glow-border">{{ courses().length }} courses found</div>
      </div>
    </div>
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Credits</th>
            <th>Type</th>
            <th>Enrollment</th>
            <th>Teacher</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of courses()">
            <td><span class="code-badge">{{ c.code }}</span></td>
            <td><strong>{{ c.name }}</strong></td>
            <td>{{ c.creditHours }}</td>
            <td><span class="course-type-badge" [class]="'type-' + c.courseType.toLowerCase()">{{ c.courseType }}</span></td>
            <td>
              <span [style.color]="c.isFull ? 'var(--accent-red)' : 'var(--accent-green)'">
                {{ c.currentEnrollment }}/{{ c.maxSeats }}
              </span>
            </td>
            <td>{{ c.teacherName ?? '—' }}</td>
            <td>
              <span class="status-badge" [class.status-active]="c.isActive" [class.status-inactive]="!c.isActive">
                {{ c.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <button class="btn-danger btn-sm" (click)="deactivate(c)">Deactivate</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="empty-state" *ngIf="courses().length === 0">
      <div class="empty-icon"><app-icon name="book-open" [size]="28"></app-icon></div>
      <h3>No courses yet</h3>
      <p>Click "+ Add Course" to create the first course.</p>
    </div>
  </div>
</div>
  `
})
export class CourseManagementComponent implements OnInit {
  courses   = signal<CourseResponse[]>([]);
  teachers  = signal<UserResponse[]>([]);
  loading   = signal(true);
  showForm  = signal(false);
  saving    = signal(false);
  formError = signal('');
  form: FormGroup;

  @ViewChild('confirmModal') confirmModal!: ConfirmModalComponent;
  pendingCourse = signal<CourseResponse | null>(null);

  constructor(private api: ApiService, private fb: FormBuilder) {
    this.form = this.fb.group({
      code:        ['', Validators.required],
      name:        ['', Validators.required],
      creditHours: [3, [Validators.required, Validators.min(1), Validators.max(6)]],
      courseType:  ['CORE', Validators.required],
      maxSeats:    [40],
      description: [''],
      teacherId:   [null]
    });
  }

  ngOnInit(): void {
    this.api.getAllCourses().subscribe({
      next: (c) => { this.courses.set(c); this.loading.set(false); }
    });
    this.api.getAllTeachers(0, 100).subscribe({
      next: (res) => this.teachers.set(res.content)
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true); this.formError.set('');
    this.api.createCourse(this.form.value as CourseRequest).subscribe({
      next: (c) => {
        this.courses.update(arr => [c, ...arr]);
        this.showForm.set(false);
        this.form.reset({ creditHours: 3, courseType: 'CORE', maxSeats: 40, teacherId: null });
        this.saving.set(false);
      },
      error: (e) => { this.formError.set(e.error?.detail || e.error?.message || 'Failed to create course.'); this.saving.set(false); }
    });
  }

  deactivate(c: CourseResponse): void {
    this.pendingCourse.set(c);
    this.confirmModal.title = 'Confirm Deactivation';
    this.confirmModal.message = `Deactivate "${c.name}"? Students will no longer be able to enroll.`;
    this.confirmModal.iconName = 'alert-triangle';
    this.confirmModal.type = 'danger';
    this.confirmModal.confirmText = 'Deactivate';
    this.confirmModal.open();
  }

  confirmDeactivate(): void {
    const c = this.pendingCourse();
    if (!c) return;

    this.api.deactivateCourse(c.id).subscribe({
      next: () => {
        this.courses.update(arr => arr.filter(x => x.id !== c.id));
        this.pendingCourse.set(null);
      }
    });
  }
}
