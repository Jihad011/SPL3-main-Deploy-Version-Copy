import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CourseResponse, SemesterResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToolbarComponent, FilterOption } from '../../../shared/components/toolbar/toolbar.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastService } from '../../../core/services/toast.service';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-course-registration',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, ToolbarComponent, ConfirmModalComponent],
  template: `
<div class="page">
  <!-- Page Header -->
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-eyebrow">Academic enrollment workspace</div>
      <h1 class="page-title">Course Registration</h1>
      <p class="page-subtitle" *ngIf="activeSemester()">
        <app-icon name="calendar" [size]="15" /> {{ activeSemester()!.label }} — Select courses for this term
      </p>
      <p class="page-subtitle" *ngIf="!activeSemester() && !loading()">
        No active semester found for course registration.
      </p>
    </div>
    <div class="header-actions">
      <a routerLink="../my-courses" class="btn btn-secondary">
        <app-icon name="list-check" [size]="15" /> View Enrolled Courses
      </a>
    </div>
  </div>

  <!-- Real-Time Credit Cap & Enrollment Meter -->
  <div class="credit-meter-card" *ngIf="!loading() && activeSemester()">
    <div class="meter-header">
      <div class="meter-info">
        <span class="meter-label">Term Credit Utilization</span>
        <span class="meter-count">
          <strong>{{ currentEnrolledCredits() }}</strong> / {{ maxCredits }} Credits Enrolled
        </span>
      </div>
      <div class="meter-status" [class.status-ok]="remainingCredits() > 0" [class.status-full]="remainingCredits() <= 0">
        <span class="status-dot"></span>
        {{ remainingCredits() > 0 ? (remainingCredits() + ' Credits Remaining') : 'Maximum Credits Reached' }}
      </div>
    </div>
    <div class="meter-track">
      <div class="meter-fill" [style.width.%]="(currentEnrolledCredits() / maxCredits) * 100"
           [class.fill-warning]="currentEnrolledCredits() >= 9 && currentEnrolledCredits() < maxCredits"
           [class.fill-full]="currentEnrolledCredits() >= maxCredits">
      </div>
    </div>
  </div>

  <div class="alert alert-success" *ngIf="success()">
    <app-icon name="check-circle" [size]="16" />
    <span>{{ success() }}</span>
    <a routerLink="../my-courses" class="alert-link" style="margin-left:auto;font-weight:600;color:inherit;text-decoration:underline">
      View in My Courses →
    </a>
  </div>
  <div class="alert alert-error" *ngIf="error()">
    <app-icon name="alert-triangle" [size]="16" />{{ error() }}
  </div>

  <div class="spinner-wrapper" *ngIf="loading()"><div class="spinner"></div></div>

  <app-confirm-modal #confirmModal (confirm)="confirmEnrollment()" />

  <!-- Universal Toolbar -->
  <app-toolbar
    *ngIf="!loading() && courses().length > 0"
    searchPlaceholder="Search by course name, code, or faculty..."
    [showViewToggle]="true"
    [defaultView]="'grid'"
    [filterOptions]="filterOptions()"
    [resultCount]="filteredCourses().length"
    (searchChange)="query.set($event)"
    (viewChange)="view.set($event)"
    (filterChange)="onFilterChange($event)"
  />

  <!-- Filter tabs bar -->
  <div class="filter-tabs-bar" *ngIf="!loading() && courses().length > 0">
    <button class="filter-tab" [class.active]="selectedType() === 'ALL'" (click)="selectedType.set('ALL')">
      All Available Courses <span class="filter-count">{{ courses().length }}</span>
    </button>
    <button class="filter-tab" *ngFor="let type of courseTypes()"
      [class.active]="selectedType() === type" (click)="selectedType.set(type)">
      {{ type }}
    </button>
  </div>

  <!-- Grid View -->
  <div class="courses-grid" *ngIf="!loading() && view() === 'grid'">
    <div class="course-card" *ngFor="let c of filteredCourses(); let i = index" [class.course-card--full]="c.isFull">
      <div class="course-card-header">
        <span class="course-code code-badge">{{ c.code }}</span>
        <span class="course-type-badge" [class]="'type-' + c.courseType.toLowerCase()">{{ c.courseType }}</span>
      </div>

      <h3 class="course-name">{{ c.name }}</h3>
      <p class="course-desc" *ngIf="c.description">{{ c.description }}</p>

      <div class="course-meta">
        <span class="meta-item"><app-icon name="clock" [size]="14" /> {{ c.creditHours }} Credit(s)</span>
        <span class="meta-item" *ngIf="c.teacherName"><app-icon name="user" [size]="14" /> {{ c.teacherName }}</span>
        <span class="meta-item text-muted font-mono" *ngIf="!c.teacherName">Faculty TBA</span>
      </div>

      <div class="seat-info" [class.seats-low]="c.availableSeats <= 5 && !c.isFull" [class.seats-full]="c.isFull">
        <div class="seat-bar">
          <div class="seat-fill" 
               [style.width.%]="(c.currentEnrollment / c.maxSeats) * 100"
               [style.background]="c.isFull ? '#DC2626' : ((c.currentEnrollment / c.maxSeats) > 0.8 ? '#D97706' : '#2563EB')">
          </div>
        </div>
        <div class="seat-text-row">
          <span class="seat-status" [class.full]="c.isFull" [class.low]="c.availableSeats <= 5 && !c.isFull">
            {{ c.isFull ? 'Class Full' : (c.availableSeats + ' seats left') }}
          </span>
          <span class="seat-count-tag numeric font-mono">{{ c.currentEnrollment }}/{{ c.maxSeats }}</span>
        </div>
      </div>

      <button class="btn-enroll" [disabled]="c.isFull || enrolling() === c.id || (currentEnrolledCredits() + c.creditHours > maxCredits)" (click)="enroll(c)">
        <span *ngIf="enrolling() !== c.id" class="button-label">
          <app-icon [name]="c.isFull ? 'lock' : 'check-circle'" [size]="15" />
          {{ c.isFull ? 'Course Full' : (currentEnrolledCredits() + c.creditHours > maxCredits ? 'Exceeds Cap' : 'Enroll Now') }}
        </span>
        <span *ngIf="enrolling() === c.id" class="spinner-sm"></span>
      </button>
    </div>
  </div>

  <!-- List View -->
  <div class="card" *ngIf="!loading() && view() === 'list' && filteredCourses().length > 0">
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Course Name</th>
            <th>Type</th>
            <th>Credits</th>
            <th>Faculty</th>
            <th>Seats Available</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr class="fade-in-up" [style.animation-delay.ms]="i * 30" *ngFor="let c of filteredCourses(); let i = index">
            <td><span class="code-badge">{{ c.code }}</span></td>
            <td><strong>{{ c.name }}</strong></td>
            <td><span class="course-type-badge" [class]="'type-' + c.courseType.toLowerCase()">{{ c.courseType }}</span></td>
            <td>{{ c.creditHours }} Cr</td>
            <td>{{ c.teacherName ?? 'TBA' }}</td>
            <td>
              <span [style.color]="c.isFull ? 'var(--accent-red)' : 'var(--accent-green)'">
                {{ c.isFull ? 'Full' : (c.availableSeats + ' / ' + c.maxSeats) }}
              </span>
            </td>
            <td>
              <button class="btn btn-primary btn-sm btn-neon" [disabled]="c.isFull || enrolling() === c.id || (currentEnrolledCredits() + c.creditHours > maxCredits)" (click)="enroll(c)">
                {{ c.isFull ? 'Full' : (enrolling() === c.id ? 'Enrolling...' : 'Enroll') }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="empty-state table-empty" *ngIf="!loading() && filteredCourses().length === 0">
    <div class="empty-icon"><app-icon [name]="courses().length === 0 ? 'check-circle' : 'search'" [size]="28" /></div>
    <h3>{{ courses().length === 0 ? "You're all enrolled!" : 'No matching courses found' }}</h3>
    <p>{{ courses().length === 0 ? 'You have registered for all available courses for this active semester.' : 'Try adjusting your search keywords or category filters.' }}</p>
    <a routerLink="../my-courses" class="btn btn-secondary" style="margin-top:0.75rem" *ngIf="courses().length === 0">
      View My Courses
    </a>
  </div>
</div>
  `,
  styles: [`
    .header-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    
    .credit-meter-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl, 16px);
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.75rem;
      box-shadow: var(--shadow-sm);
    }
    .meter-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .meter-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .meter-label {
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .meter-count {
      font-size: 0.95rem;
      color: var(--text-primary);
      strong { color: var(--cyan); font-weight: 800; }
    }
    .meter-status {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.2rem 0.65rem;
      border-radius: 9999px;
    }
    .status-ok {
      background: rgba(5, 150, 105, 0.08);
      color: var(--accent-green);
      border: 1px solid rgba(5, 150, 105, 0.25);
      .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-green); }
    }
    .status-full {
      background: rgba(217, 119, 6, 0.08);
      color: var(--accent-orange);
      border: 1px solid rgba(217, 119, 6, 0.25);
      .status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-orange); }
    }
    .meter-track {
      width: 100%;
      height: 8px;
      background: var(--bg-elevated);
      border-radius: 9999px;
      overflow: hidden;
    }
    .meter-fill {
      height: 100%;
      background: var(--grad-primary);
      border-radius: 9999px;
      transition: width 0.4s ease;
    }
    .fill-warning {
      background: linear-gradient(135deg, var(--cyan), var(--accent-orange));
    }
    .fill-full {
      background: linear-gradient(135deg, var(--accent-orange), var(--accent-red));
    }

    .filter-tabs-bar {
      display: flex; gap: 0.5rem; margin-bottom: 1.25rem;
      border-bottom: 1px solid var(--border); padding-bottom: 0;
    }
    .filter-tab {
      display: flex; align-items: center; gap: 0.4rem;
      padding: 0.6rem 1rem; border: none; background: none;
      color: var(--text-muted); font-size: 0.875rem; cursor: pointer;
      border-bottom: 2px solid transparent; margin-bottom: -1px;
      transition: all .2s; font-family: inherit; font-weight: 500;
    }
    .filter-tab:hover { color: var(--text-primary); }
    .filter-tab.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
    .filter-count {
      background: var(--bg-elevated); border-radius: 20px;
      padding: 0.05rem 0.5rem; font-size: 0.72rem;
    }
    .prereq-badge-row {
      margin-top: 0.25rem;
    }
    .prereq-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.55rem;
      background: rgba(217, 119, 6, 0.08);
      border: 1px solid rgba(217, 119, 6, 0.25);
      color: var(--accent-orange);
      font-size: 0.75rem;
      border-radius: var(--radius-xs);
      font-weight: 600;
    }
    .seat-text-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
    }
    .seat-count-tag {
      font-size: 0.75rem;
      color: var(--text-muted);
      background: var(--bg-elevated);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-weight: 700;
    }
    .alert-link:hover { opacity: 0.85; }
  `]
})
export class CourseRegistrationComponent implements OnInit {
  courses               = signal<CourseResponse[]>([]);
  loading               = signal(true);
  enrolling             = signal<number | null>(null);
  success               = signal('');
  error                 = signal('');
  activeSemId           = signal<number | null>(null);
  activeSemester        = signal<SemesterResponse | null>(null);
  query                 = signal('');
  selectedType          = signal('ALL');
  view                  = signal<'grid' | 'list'>('grid');
  currentEnrolledCredits = signal<number>(0);
  readonly maxCredits   = 12;

  remainingCredits = computed(() => Math.max(0, this.maxCredits - this.currentEnrolledCredits()));

  @ViewChild('confirmModal') confirmModal!: ConfirmModalComponent;
  pendingEnrollCourse = signal<CourseResponse | null>(null);
  pendingRetake = signal(false);

  courseTypes = computed(() => Array.from(new Set(this.courses().map(c => c.courseType))).sort());
  filterOptions = computed<FilterOption[]>(() =>
    this.courseTypes().map(t => ({ label: t, value: t }))
  );

  filteredCourses = computed(() => {
    const q = this.query().trim().toLowerCase();
    const type = this.selectedType();
    return this.courses().filter(course => {
      const matchesType = type === 'ALL' || course.courseType === type;
      const matchesQuery = !q ||
        course.name.toLowerCase().includes(q) ||
        course.code.toLowerCase().includes(q) ||
        (course.teacherName ?? '').toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  });

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadActiveSemester();
    this.loadEnrolledCredits();
    this.loadCourses();
  }

  loadActiveSemester(): void {
    this.api.getActiveSemesters().subscribe({
      next: (sems) => {
        if (sems && sems.length > 0) {
          this.activeSemId.set(sems[0].id);
          this.activeSemester.set(sems[0]);
        }
      }
    });
  }

  loadEnrolledCredits(): void {
    this.api.getMyCourses().subscribe({
      next: (courses) => {
        const total = (courses || []).reduce((acc, c) => acc + (c.creditHours || 0), 0);
        this.currentEnrolledCredits.set(total);
      },
      error: () => {}
    });
  }

  loadCourses(): void {
    this.loading.set(true);
    this.api.getAvailableCourses().subscribe({
      next: (c) => { this.courses.set(c); this.loading.set(false); },
      error: ()  => { this.error.set('Failed to load courses.'); this.loading.set(false); }
    });
  }

  onFilterChange(types: string[]): void {
    if (types.length === 0) this.selectedType.set('ALL');
    else this.selectedType.set(types[0]);
  }

  enroll(course: CourseResponse, retake = false): void {
    const semId = this.activeSemId();
    if (!semId) {
      this.error.set('No active semester found for enrollment.');
      this.toast.error('No active semester found for enrollment.');
      return;
    }

    if (this.currentEnrolledCredits() + course.creditHours > this.maxCredits) {
      this.toast.warning(`Enrolling in this course exceeds your ${this.maxCredits} credit term limit.`);
      return;
    }

    this.pendingEnrollCourse.set(course);
    this.pendingRetake.set(retake);
    this.confirmModal.title = 'Confirm Course Enrollment';
    this.confirmModal.message = `Are you sure you want to enroll in ${course.code} - ${course.name} (${course.creditHours} Credits)?`;
    this.confirmModal.iconName = 'book-open';
    this.confirmModal.type = 'info';
    this.confirmModal.confirmText = 'Enroll Now';
    this.confirmModal.open();
  }

  confirmEnrollment(): void {
    const course = this.pendingEnrollCourse();
    const semId = this.activeSemId();
    if (!course || !semId) return;

    this.success.set(''); this.error.set('');
    this.enrolling.set(course.id);
    this.api.enroll({ courseId: course.id, semesterId: semId, retake: this.pendingRetake() }).subscribe({
      next: () => {
        this.enrolling.set(null);
        const msg = `Successfully enrolled in ${course.name}!`;
        this.success.set(msg);
        this.toast.success(msg + ' View in My Course(s).');
        this.currentEnrolledCredits.update(v => v + course.creditHours);
        this.loadCourses();
      },
      error: (e) => {
        this.enrolling.set(null);
        const msg = e.error?.detail || e.error?.message || 'Enrollment failed.';
        this.error.set(msg);
        this.toast.error(msg);
      }
    });
  }
}
