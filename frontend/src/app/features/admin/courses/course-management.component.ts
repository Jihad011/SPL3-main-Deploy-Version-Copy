import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { CourseResponse, CourseRequest, UserResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToolbarComponent } from '../../../shared/components/toolbar/toolbar.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-course-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IconComponent, ToolbarComponent, ConfirmModalComponent],
  template: `
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-eyebrow">Academic catalog</div>
      <h1 class="page-title">Course Management</h1>
      <p class="page-subtitle">Create and manage course offerings</p>
    </div>
    <button class="btn btn-primary" (click)="showForm.set(!showForm())">
      <app-icon [name]="showForm() ? 'x' : 'book-open'" [size]="15"></app-icon>
      {{ showForm() ? 'Cancel' : 'Add Course' }}
    </button>
  </div>

  <!-- Create Course Panel -->
  <div class="card form-panel" *ngIf="showForm()">
    <div class="card-header">
      <div class="card-title">Create New Course</div>
      <div class="card-sub">Fill in all required fields</div>
    </div>
    <div class="form-card">
      <div class="alert alert-error" *ngIf="formError()">
        <app-icon name="alert-triangle" [size]="16"></app-icon>{{ formError() }}
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

  <!-- Universal Toolbar -->
  <app-toolbar
    *ngIf="!loading() && courses().length > 0"
    searchPlaceholder="Search by course code, name, or faculty..."
    [showViewToggle]="false"
    [resultCount]="filteredCourses().length"
    (searchChange)="query.set($event)"
  />

  <!-- Courses Table -->
  <div class="card card-glow-border" *ngIf="!loading()">
    <div class="card-header card-glow-border">
      <div>
        <div class="card-title card-glow-border">All Academic Courses</div>
        <div class="card-sub card-glow-border">{{ filteredCourses().length }} of {{ courses().length }} courses found</div>
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
            <th>Assigned Faculty</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of filteredCourses()">
            <td><span class="code-badge">{{ c.code }}</span></td>
            <td><strong>{{ c.name }}</strong></td>
            <td>{{ c.creditHours }} Cr</td>
            <td><span class="course-type-badge" [class]="'type-' + c.courseType.toLowerCase()">{{ c.courseType }}</span></td>
            <td>
              <span [style.color]="c.isFull ? 'var(--accent-red)' : 'var(--accent-green)'">
                {{ c.currentEnrollment }} / {{ c.maxSeats }}
              </span>
            </td>
            <td>{{ c.teacherName ?? '—' }}</td>
            <td>
              <span class="status-badge" [class.status-active]="c.isActive" [class.status-inactive]="!c.isActive">
                <span class="badge-dot" *ngIf="c.isActive"></span>
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
    <div class="empty-state" *ngIf="filteredCourses().length === 0">
      <div class="empty-icon"><app-icon name="book-open" [size]="28"></app-icon></div>
      <h3>No courses found</h3>
      <p>Try adjusting your search query or click '+ Add Course' to create a new offering.</p>
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
  query     = signal('');
  form: FormGroup;

  filteredCourses = computed(() => {
    const q = this.query().trim().toLowerCase();
    return !q ? this.courses() : this.courses().filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.teacherName || '').toLowerCase().includes(q) ||
      c.courseType.toLowerCase().includes(q)
    );
  });

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
