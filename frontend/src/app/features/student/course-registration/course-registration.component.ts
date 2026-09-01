import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CourseResponse, SemesterResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToolbarComponent, FilterOption } from '../../../shared/components/toolbar/toolbar.component';
import { ToastService } from '../../../core/services/toast.service';

// CenterPoint Shared Components
import {
  ConfirmationDialogue,
  GenericButton
} from '../../../shared';

@Component({
  selector: 'app-course-registration',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    ToolbarComponent,
    ConfirmationDialogue,
    GenericButton
  ],
  template: `
<div class="page">
  <!-- Page Header -->
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-eyebrow">Academic enrollment workspace</div>
      <h1 class="page-title">Course Enrollment</h1>
      <p class="page-subtitle" *ngIf="activeSemester()">
        <app-icon name="calendar" [size]="15" /> {{ activeSemester()!.label }} — Select and enroll in courses for this term
      </p>
      <p class="page-subtitle" *ngIf="!activeSemester() && !loading()">
        No active semester found for course enrollment.
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
        <span class="meter-count font-mono">
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
        <span class="course-code code-badge font-mono">{{ c.code }}</span>
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

      <generic-button
        [label]="c.isFull ? 'Course Full' : (currentEnrolledCredits() + c.creditHours > maxCredits ? 'Exceeds Cap' : 'Enroll Now')"
        [icon]="c.isFull ? 'lock' : 'check-circle'"
        [enable]="!c.isFull && enrolling() !== c.id && (currentEnrolledCredits() + c.creditHours <= maxCredits)"
        styles="width: 100%; margin-top: 0.75rem; justify-content: center;"
        (onClick)="enroll(c)"
      />
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
            <td><span class="code-badge font-mono">{{ c.code }}</span></td>
            <td><strong>{{ c.name }}</strong></td>
            <td><span class="course-type-badge" [class]="'type-' + c.courseType.toLowerCase()">{{ c.courseType }}</span></td>
            <td>{{ c.creditHours }} Cr</td>
            <td>{{ c.teacherName ?? 'TBA' }}</td>
            <td>
              <span [style.color]="c.isFull ? 'var(--accent-red)' : 'var(--accent-green)'" class="font-mono font-semibold">
                {{ c.isFull ? 'Full' : (c.availableSeats + ' / ' + c.maxSeats) }}
              </span>
            </td>
            <td>
              <generic-button
                [label]="c.isFull ? 'Full' : 'Enroll'"
                [enable]="!c.isFull && enrolling() !== c.id && (currentEnrolledCredits() + c.creditHours <= maxCredits)"
                styles="font-size: 0.8rem; padding: 0.35rem 0.75rem;"
                (onClick)="enroll(c)"
              />
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

  <!-- CenterPoint Confirmation Dialogue -->
  <confirmation-dialogue
    [isOpen]="showConfirmDialogue()"
    title="Confirm Course Registration"
    [message]="confirmMessage()"
    variant="primary"
    (close)="showConfirmDialogue.set(false)"
    (buttonClick)="onConfirmModalAction($event)"
  />
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
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .meter-count {
      font-size: 0.95rem;
      color: var(--text-primary);
    }
    .meter-status {
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .meter-status.status-ok { color: var(--accent-green, #10b981); }
    .meter-status.status-full { color: var(--accent-red, #ef4444); }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }
    .meter-track {
      height: 8px;
      background: var(--bg-elevated);
      border-radius: 4px;
      overflow: hidden;
    }
    .meter-fill {
      height: 100%;
      background: var(--accent-primary);
      transition: width 0.3s ease;
    }
    .meter-fill.fill-warning { background: #f59e0b; }
    .meter-fill.fill-full { background: #ef4444; }

    .filter-tabs-bar {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0;
      margin-bottom: 1.25rem;
    }
    .filter-tab {
      padding: 0.6rem 1rem;
      border: none;
      background: none;
      color: var(--text-muted);
      font-size: 0.875rem;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: all 0.2s;
      font-weight: 500;
    }
    .filter-tab:hover { color: var(--text-primary); }
    .filter-tab.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); font-weight: 600; }
    .filter-count {
      background: var(--bg-elevated);
      border-radius: 20px;
      padding: 0.05rem 0.5rem;
      font-size: 0.72rem;
    }

    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }
    .course-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: all 0.2s;
    }
    .course-card:hover {
      border-color: var(--accent-primary);
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }
    .course-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .course-name {
      font-size: 1.05rem;
      font-weight: 700;
      margin: 0;
      color: var(--text-primary);
    }
    .course-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin: 0;
      line-height: 1.4;
    }
    .course-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .seat-info {
      background: var(--bg-elevated);
      border-radius: 8px;
      padding: 0.6rem 0.85rem;
      border: 1px solid var(--border);
    }
    .seat-bar {
      height: 5px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 0.4rem;
    }
    .seat-fill { height: 100%; }
    .seat-text-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
    }
    .seat-status.full { color: #ef4444; font-weight: 600; }
    .seat-status.low { color: #f59e0b; font-weight: 600; }
  `]
})
export class CourseRegistrationComponent implements OnInit {
  courses = signal<CourseResponse[]>([]);
  activeSemId = signal<number | null>(null);
  activeSemester = signal<SemesterResponse | null>(null);
  loading = signal(true);
  enrolling = signal<number | null>(null);
  success = signal('');
  error = signal('');
  query = signal('');
  view = signal<'grid' | 'list'>('grid');
  selectedType = signal('ALL');

  currentEnrolledCredits = signal<number>(0);
  readonly maxCredits = 12;

  showConfirmDialogue = signal(false);
  pendingEnrollCourse = signal<CourseResponse | null>(null);
  pendingRetake = signal(false);

  remainingCredits = computed(() => Math.max(0, this.maxCredits - this.currentEnrolledCredits()));

  courseTypes = computed(() => {
    const types = new Set(this.courses().map(c => c.courseType));
    return Array.from(types);
  });

  filterOptions = computed<FilterOption[]>(() => {
    return this.courseTypes().map(type => ({
      label: type,
      value: type,
      count: this.courses().filter(c => c.courseType === type).length
    }));
  });

  filteredCourses = computed(() => {
    let result = this.courses();
    const type = this.selectedType();
    if (type !== 'ALL') {
      result = result.filter(c => c.courseType === type);
    }
    const q = this.query().trim().toLowerCase();
    if (q) {
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.teacherName || '').toLowerCase().includes(q)
      );
    }
    return result;
  });

  confirmMessage = computed(() => {
    const course = this.pendingEnrollCourse();
    return course ? `Are you sure you want to register for ${course.code} — ${course.name} (${course.creditHours} Credits)?` : '';
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
    this.api.getMyEnrollments().subscribe({
      next: (enrollments) => {
        const activeSemId = this.activeSemId();
        const active = (enrollments || []).filter(e =>
          e.status === 'ACTIVE' && (!activeSemId || e.semesterId === activeSemId)
        );
        const total = active.reduce((acc, e) => acc + (e.creditHours || 0), 0);
        this.currentEnrolledCredits.set(total);
      },
      error: () => {}
    });
  }

  loadCourses(): void {
    this.loading.set(true);
    this.api.getAvailableCourses().subscribe({
      next: (c) => { this.courses.set(c); this.loading.set(false); },
      error: () => { this.error.set('Failed to load courses.'); this.loading.set(false); }
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
    this.showConfirmDialogue.set(true);
  }

  onConfirmModalAction(event: any): void {
    this.showConfirmDialogue.set(false);
    if (event && (event.action === 'confirm' || event.action === 'click')) {
      this.confirmEnrollment();
    }
  }

  confirmEnrollment(): void {
    const course = this.pendingEnrollCourse();
    const semId = this.activeSemId();
    if (!course || !semId) return;

    this.success.set('');
    this.error.set('');
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
