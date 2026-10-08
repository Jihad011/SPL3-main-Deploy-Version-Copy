import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CourseResponse, SemesterResponse, EnrollmentResponse } from '../../../core/models/models';
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
    FormsModule,
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
      <p class="page-subtitle">
        <app-icon name="calendar" [size]="15" /> {{ selectedSemesterLevel() === 1 ? '1st Semester' : (selectedSemesterLevel() === 2 ? '2nd Semester' : '3rd Semester') }} — {{ selectedSemesterType() }} Intake Cycle (2026)
      </p>
    </div>
    <div class="header-actions">
      <a routerLink="../my-courses" class="btn btn-secondary">
        <app-icon name="list-check" [size]="15" /> View Enrolled Courses
      </a>
    </div>
  </div>

  <!-- Top Academic Term Selectors: Semester Name & Semester Type -->
  <div class="top-selector-bar">
    <div class="selector-card">
      <label class="selector-label">
        <app-icon name="book-open" [size]="15" /> Semester Name
      </label>
      <select class="selector-dropdown font-mono" [ngModel]="selectedSemesterLevel()" (ngModelChange)="selectedSemesterLevel.set(+$event)">
        <option [value]="1">1st Semester</option>
        <option [value]="2">2nd Semester</option>
        <option [value]="3">3rd Semester</option>
      </select>
    </div>

    <div class="selector-card">
      <label class="selector-label">
        <app-icon name="calendar" [size]="15" /> Semester Type
      </label>
      <select class="selector-dropdown font-mono" [ngModel]="selectedSemesterType()" (ngModelChange)="selectedSemesterType.set($event)">
        <option value="Spring">Spring Intake</option>
        <option value="Fall">Fall Intake</option>
      </select>
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
        <span class="course-type-badge" [class]="'type-' + c.courseType.toLowerCase()">{{ c.courseType === 'CORE' ? 'Mandatory' : 'Optional' }}</span>
      </div>

      <h3 class="course-name">{{ c.name }}</h3>
      <div class="course-teacher-line" style="font-size: 0.85rem; font-weight: 600; color: var(--accent-primary, #2563eb); margin-top: 0.25rem; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.35rem;">
        <app-icon name="user" [size]="14"></app-icon>
        <span>Instructor: <strong>{{ getInstructorName(c) }}</strong></span>
      </div>

      <div *ngIf="c.syllabusUrl" style="margin-top: 0.15rem;">
        <a [href]="getSyllabusFullUrl(c.syllabusUrl)" target="_blank" style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; font-weight: 600; color: var(--accent-primary, #2563eb); text-decoration: underline;">
          <app-icon name="file-text" [size]="14" /> Download Official Syllabus File
        </a>
      </div>

      <div class="course-meta" style="flex-wrap: wrap; gap: 0.6rem;">
        <span class="meta-item"><app-icon name="clock" [size]="14" /> {{ c.creditHours }} Credit(s)</span>
        <span class="meta-item"><app-icon name="calendar" [size]="14" /> {{ getCourseSemesterDisplay(c) }}</span>
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
        [label]="isCourseEnrolled(c.code) ? 'Already Enrolled' : (c.isFull ? 'Course Full' : (currentEnrolledCredits() + c.creditHours > maxCredits ? 'Exceeds Cap' : 'Enroll Now'))"
        [icon]="isCourseEnrolled(c.code) ? 'check-circle' : (c.isFull ? 'lock' : 'check-circle')"
        [enable]="!isCourseEnrolled(c.code) && !c.isFull && enrolling() !== c.id && (currentEnrolledCredits() + c.creditHours <= maxCredits)"
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
            <th>Course Name & Instructor</th>
            <th>Type</th>
            <th>Credits</th>
            <th>Seats Available</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr class="fade-in-up" [style.animation-delay.ms]="i * 30" *ngFor="let c of filteredCourses(); let i = index">
            <td><span class="code-badge font-mono">{{ c.code }}</span></td>
            <td>
              <strong>{{ c.name }}</strong>
              <div style="font-size: 0.78rem; font-weight: 600; color: var(--accent-primary, #2563eb); margin-top: 0.15rem; display: flex; align-items: center; gap: 0.3rem;">
                <app-icon name="user" [size]="12" />
                <span>Instructor: {{ getInstructorName(c) }}</span>
              </div>
            </td>
            <td><span class="course-type-badge" [class]="'type-' + c.courseType.toLowerCase()">{{ c.courseType }}</span></td>
            <td>{{ c.creditHours }} Cr</td>
            <td>
              <span [style.color]="c.isFull ? 'var(--accent-red)' : 'var(--accent-green)'" class="font-mono font-semibold">
                {{ c.isFull ? 'Full' : (c.availableSeats + ' / ' + c.maxSeats) }}
              </span>
            </td>
            <td>
              <generic-button
                [label]="isCourseEnrolled(c.code) ? 'Enrolled' : (c.isFull ? 'Full' : 'Enroll')"
                [enable]="!isCourseEnrolled(c.code) && !c.isFull && enrolling() !== c.id && (currentEnrolledCredits() + c.creditHours <= maxCredits)"
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
    
    .top-selector-bar {
      display: flex;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .selector-card {
      flex: 1;
      min-width: 240px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 0.85rem 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      box-shadow: var(--shadow-sm);
    }
    .selector-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--accent-primary, #2563eb);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .selector-dropdown {
      padding: 0.55rem 0.85rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg-elevated);
      color: var(--text-primary);
      font-size: 0.95rem;
      font-weight: 600;
      outline: none;
      cursor: pointer;
    }
    .selector-dropdown:focus {
      border-color: var(--accent-primary);
    }
    
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
  selectedSemesterLevel = signal<number>(1);
  selectedSemesterType = signal<'Spring' | 'Fall'>('Spring');

  allEnrollments = signal<EnrollmentResponse[]>([]);
  readonly maxCredits = 12;

  showConfirmDialogue = signal(false);
  pendingEnrollCourse = signal<CourseResponse | null>(null);
  pendingRetake = signal(false);

  isCourseEnrolled(courseCode: string): boolean {
    const level = this.selectedSemesterLevel();
    const type = this.selectedSemesterType();

    return this.allEnrollments().some(e => {
      if (e.courseCode !== courseCode) return false;
      if (e.status !== 'ACTIVE' && e.status !== 'COMPLETED') return false;

      const eLevel = e.targetSemesterLevel ?? (
        ['MITM 303', 'MITM 304', 'MITM 310', 'MITM 311'].includes(e.courseCode) ? 1 :
        ['MITM 301', 'MITM 305'].includes(e.courseCode) ? 2 :
        e.courseCode === 'MITM 421' ? 3 : 2
      );

      const eType = e.intakeType || 'Spring';
      return eLevel === level && eType.toLowerCase() === type.toLowerCase();
    });
  }

  currentEnrolledCredits = computed(() => {
    const enrollments = this.allEnrollments();
    const level = this.selectedSemesterLevel();
    const type = this.selectedSemesterType();

    const activeLevelEnrollments = enrollments.filter(e => {
      if (e.status !== 'ACTIVE' && e.status !== 'COMPLETED') return false;
      const eLevel = e.targetSemesterLevel ?? (
        ['MITM 303', 'MITM 304', 'MITM 310', 'MITM 311'].includes(e.courseCode) ? 1 :
        ['MITM 301', 'MITM 305'].includes(e.courseCode) ? 2 :
        e.courseCode === 'MITM 421' ? 3 : 2
      );
      const eType = e.intakeType || 'Spring';
      return eLevel === level && eType.toLowerCase() === type.toLowerCase();
    });

    return activeLevelEnrollments.reduce((sum, e) => sum + (e.creditHours || 0), 0);
  });

  remainingCredits = computed(() => Math.max(0, this.maxCredits - this.currentEnrolledCredits()));

  totalCompletedCredits = signal<number>(0);

  studentSemesterLevel = computed(() => {
    const credits = this.totalCompletedCredits();
    if (credits >= 24) return 3; // 3rd Semester
    if (credits >= 12) return 2; // 2nd Semester
    return 1;                    // 1st Semester
  });

  courseTypes = computed(() => {
    const tracks = new Set<string>();
    for (const c of this.courses()) {
      if (c.track) tracks.add(c.track);
      else if (c.courseType) tracks.add(c.courseType);
    }
    return Array.from(tracks);
  });

  filterOptions = computed<FilterOption[]>(() => {
    return this.courseTypes().map(type => ({
      label: type,
      value: type,
      count: this.courses().filter(c => c.track === type || c.courseType === type).length
    }));
  });

  filteredCourses = computed(() => {
    let result = this.courses();
    const level = this.selectedSemesterLevel();

    // Semester-level filtering matching official curriculum rules:
    // Level 1 (1st Semester): ONLY 4 mandatory courses (MITM 303, 304, 310, 311) - strictly NO optional courses
    // Level 2 (2nd Semester): 2 mandatory 2nd semester courses (MITM 301, 305) + ALL optional track courses
    // Level 3 (3rd Semester): 1 mandatory 3rd semester project (MITM 421) + ALL optional track courses
    if (level === 1) {
      result = result.filter(c => (c.semesterLevel === 1 || ['MITM 303', 'MITM 304', 'MITM 310', 'MITM 311'].includes(c.code)) && c.courseType !== 'OPTIONAL');
    } else if (level === 2) {
      result = result.filter(c => c.semesterLevel === 2 || ['MITM 301', 'MITM 305'].includes(c.code) || c.courseType === 'OPTIONAL');
    } else if (level === 3) {
      result = result.filter(c => c.semesterLevel === 3 || c.code === 'MITM 421' || c.courseType === 'OPTIONAL');
    }

    const type = this.selectedType();
    if (type !== 'ALL') {
      result = result.filter(c => c.track === type || c.courseType === type);
    }
    const q = this.query().trim().toLowerCase();
    if (q) {
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.track || '').toLowerCase().includes(q) ||
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

  getInstructorName(c: CourseResponse): string {
    if (c.teacherName && c.teacherName !== 'Faculty TBA' && c.teacherName !== 'Faculty Instructor') {
      return c.teacherName;
    }
    const map: Record<string, string> = {
      'MITM 303': 'Dr. Md. Shariful Islam',
      'MITM 304': 'Dr. Mohammad Shoyaib',
      'MITM 310': 'Dr. Ahmedul Kabir',
      'MITM 311': 'Dr. B. M. Mainul Hossain',
      'MITM 301': 'Md. Saeed Siddik',
      'MITM 305': 'Dr. Md. Nurul Ahad Tawhid',
      'MITM 421': 'Dr. Ahmedul Kabir',
      'MITE 436': 'Dr. Ahmedul Kabir',
      'MITE 430': 'Dr. B. M. Mainul Hossain',
      'MITE 437': 'Dr. Mohammad Shoyaib',
      'MITE 431': 'Dr. B. M. Mainul Hossain',
      'MITE 434': 'Md. Saeed Siddik',
      'MITE 439': 'Dr. Kazi Muheymin-Us-Sakib',
      'MITE 435': 'Toukir Ahammed',
      'MITE 441': 'Toukir Ahammed',
      'MITE 432': 'Dr. Md. Shariful Islam',
      'MITE 442': 'Dr. Md. Shariful Islam',
      'MITE 438': 'Dr. Md. Shariful Islam',
      'MITE 455': 'Dr. Md. Shariful Islam',
      'MITE 433': 'Dr. Md. Shariful Islam'
    };
    return map[c.code] || 'Faculty Instructor';
  }

  getCourseSemesterDisplay(c: CourseResponse): string {
    if (c.semesterLevel === 1 || ['MITM 303', 'MITM 304', 'MITM 310', 'MITM 311'].includes(c.code)) return 'First Semester';
    if (c.semesterLevel === 2 || ['MITM 301', 'MITM 305'].includes(c.code)) return 'Second Semester';
    if (c.semesterLevel === 3 || c.code === 'MITM 421') return 'Third Semester';
    return 'Second & Third Semester';
  }

  getSyllabusFullUrl(url: string | null): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url}`;
  }

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
        const list = enrollments || [];
        this.allEnrollments.set(list);

        const completed = list.filter(e => e.status === 'COMPLETED');
        const completedTotal = completed.reduce((acc, e) => acc + (e.creditHours || 0), 0);
        this.totalCompletedCredits.set(completedTotal);
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

    this.api.enroll({
      courseId: course.id,
      semesterId: semId,
      retake: this.pendingRetake(),
      targetSemesterLevel: this.selectedSemesterLevel(),
      intakeType: this.selectedSemesterType()
    }).subscribe({
      next: () => {
        this.enrolling.set(null);
        const msg = `Successfully enrolled in ${course.name}!`;
        this.success.set(msg);
        this.toast.success(msg + ' View in My Course(s).');
        this.loadEnrolledCredits();
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
