import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { EnrollmentResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToolbarComponent } from '../../../shared/components/toolbar/toolbar.component';
import { ToastService } from '../../../core/services/toast.service';

// CenterPoint Shared Components
import {
  SummaryCardStrip,
  SummaryCardItem,
  ConfirmationDialogue,
  GenericButton
} from '../../../shared';

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    IconComponent,
    ToolbarComponent,
    SummaryCardStrip,
    ConfirmationDialogue,
    GenericButton
  ],
  template: `
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-eyebrow">Academic Enrollment</div>
      <h1 class="page-title">My Course(s)</h1>
      <p class="page-subtitle">View and manage your registered courses for all semesters</p>
    </div>
    <div class="header-actions">
      <div class="metric-chip metric-chip--green font-mono" *ngIf="!loading()">
        <app-icon name="book-open" [size]="15"></app-icon>
        {{ activeCount() }} active course(s) · {{ totalCredits() }} credit(s)
      </div>
      <a routerLink="../courses" class="btn btn-primary">
        <app-icon name="book-open" [size]="15" /> Course Enrollment
      </a>
    </div>
  </div>

  <div class="spinner-wrapper" *ngIf="loading()"><div class="spinner"></div></div>

  <!-- Summary Card Strip -->
  <div style="margin-bottom: 1.5rem;" *ngIf="!loading() && enrollments().length > 0">
    <app-summary-card-strip [items]="summaryItems()" displayMode="page" />
  </div>

  <!-- Filter & Search Toolbar -->
  <app-toolbar
    *ngIf="!loading() && enrollments().length > 0"
    searchPlaceholder="Search by course code, name, or semester..."
    [showViewToggle]="true"
    [defaultView]="'grid'"
    [resultCount]="filteredEnrollments().length"
    (searchChange)="searchQuery.set($event)"
    (viewChange)="view.set($event)"
  />

  <!-- Filter Status Tabs -->
  <div class="filter-tabs-bar" *ngIf="!loading() && enrollments().length > 0">
    <button class="filter-tab" [class.active]="statusFilter() === 'ALL'" (click)="statusFilter.set('ALL')">
      All <span class="filter-count">{{ enrollments().length }}</span>
    </button>
    <button class="filter-tab" [class.active]="statusFilter() === 'ACTIVE'" (click)="statusFilter.set('ACTIVE')">
      <span class="dot-active"></span>Active <span class="filter-count">{{ activeCount() }}</span>
    </button>
    <button class="filter-tab" [class.active]="statusFilter() === 'COMPLETED'" (click)="statusFilter.set('COMPLETED')">
      <span class="dot-completed"></span>Completed <span class="filter-count">{{ completedCount() }}</span>
    </button>
    <button class="filter-tab" [class.active]="statusFilter() === 'DROPPED'" (click)="statusFilter.set('DROPPED')" *ngIf="droppedCount() > 0">
      <span class="dot-dropped"></span>Dropped <span class="filter-count">{{ droppedCount() }}</span>
    </button>
  </div>

  <!-- Grid View -->
  <div class="courses-grid" *ngIf="!loading() && view() === 'grid' && filteredEnrollments().length > 0">
    <div class="course-card my-course-card" *ngFor="let e of filteredEnrollments(); let i = index"
         [class.card-dropped]="e.status === 'DROPPED'">
      <div class="course-card-header">
        <span class="code-badge font-mono">{{ e.courseCode }}</span>
        <span class="status-badge" [class]="'status-' + e.status.toLowerCase()">
          {{ e.status }}
        </span>
      </div>

      <h3 class="course-name">{{ e.courseName }}</h3>

      <div class="course-meta">
        <span class="meta-item"><app-icon name="clock" [size]="14"></app-icon>{{ e.creditHours }} credit(s)</span>
        <span class="meta-item"><app-icon name="calendar" [size]="14"></app-icon>{{ e.semesterLabel }}</span>
        <span class="retake-badge" *ngIf="e.isRetake">Retake</span>
      </div>

      <div class="enrolled-date-row font-mono">
        Enrolled on {{ e.enrolledAt | date:'mediumDate' }}
      </div>

      <div class="card-action-bar" *ngIf="e.status === 'ACTIVE'">
        <generic-button
          label="Drop Course"
          icon="trash"
          styles="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); font-size: 0.8rem; padding: 0.35rem 0.75rem; width: 100%; justify-content: center;"
          [enable]="droppingId() !== e.id"
          (onClick)="confirmDrop(e)"
        />
      </div>
    </div>
  </div>

  <!-- List View -->
  <div class="card" *ngIf="!loading() && view() === 'list' && filteredEnrollments().length > 0">
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Course Code</th>
            <th>Course Name</th>
            <th>Credits</th>
            <th>Semester</th>
            <th>Type / Retake</th>
            <th>Enrolled Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr class="fade-in-up" *ngFor="let e of filteredEnrollments(); let i = index" 
              [style.animation-delay.ms]="i * 30"
              [class.row-dropped]="e.status === 'DROPPED'">
            <td><span class="code-badge font-mono">{{ e.courseCode }}</span></td>
            <td><strong>{{ e.courseName }}</strong></td>
            <td>{{ e.creditHours }} Cr</td>
            <td>{{ e.semesterLabel }}</td>
            <td>
              <span class="badge badge-subtle" *ngIf="!e.isRetake">Regular</span>
              <span class="retake-badge" *ngIf="e.isRetake">Retake</span>
            </td>
            <td><span class="font-mono text-muted">{{ e.enrolledAt | date:'dd MMM yyyy' }}</span></td>
            <td>
              <span class="status-badge" [class]="'status-' + e.status.toLowerCase()">
                {{ e.status }}
              </span>
            </td>
            <td>
              <generic-button
                *ngIf="e.status === 'ACTIVE'"
                label="Drop"
                icon="x"
                styles="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); font-size: 0.75rem; padding: 0.25rem 0.55rem;"
                [enable]="droppingId() !== e.id"
                (onClick)="confirmDrop(e)"
              />
              <span *ngIf="e.status !== 'ACTIVE'" class="text-muted text-xs">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="empty-state" *ngIf="!loading() && filteredEnrollments().length === 0">
    <div class="empty-icon"><app-icon name="book-open" [size]="28" /></div>
    <h3>No course enrollments found</h3>
    <p>You haven't enrolled in any courses under this filter.</p>
  </div>

  <!-- CenterPoint Confirmation Dialogue -->
  <confirmation-dialogue
    [isOpen]="showConfirmDialogue()"
    title="Confirm Drop Course"
    [message]="confirmMessage()"
    variant="danger"
    (close)="onCancelDrop()"
    (buttonClick)="onConfirmDropModalAction($event)"
  />

</div>
  `,
  styles: [`
    .metric-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .metric-chip--green {
      background: rgba(16, 185, 129, 0.12);
      color: var(--accent-green, #10b981);
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .header-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }

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
    .dot-active { width: 8px; height: 8px; border-radius: 50%; background: var(--accent-green, #10b981); display: inline-block; }
    .dot-completed { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; display: inline-block; }
    .dot-dropped { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; display: inline-block; }

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
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }
    .course-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .course-name { font-size: 1.05rem; font-weight: 700; margin: 0; color: var(--text-primary); }
    .course-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
      flex-wrap: wrap;
    }
    .meta-item { display: flex; align-items: center; gap: 0.35rem; }
    .retake-badge {
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .enrolled-date-row {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .card-action-bar {
      margin-top: 0.5rem;
    }
  `]
})
export class MyCoursesComponent implements OnInit {
  enrollments = signal<EnrollmentResponse[]>([]);
  loading = signal(true);
  droppingId = signal<number | null>(null);
  searchQuery = signal('');
  statusFilter = signal<string>('ALL');
  view = signal<'grid' | 'list'>('grid');

  activeCount = computed(() => this.enrollments().filter(e => e.status === 'ACTIVE').length);
  completedCount = computed(() => this.enrollments().filter(e => e.status === 'COMPLETED').length);
  droppedCount = computed(() => this.enrollments().filter(e => e.status === 'DROPPED').length);

  totalCredits = computed(() =>
    this.enrollments()
      .filter(e => e.status === 'ACTIVE' || e.status === 'COMPLETED')
      .reduce((sum, e) => sum + e.creditHours, 0)
  );

  summaryItems = computed<SummaryCardItem[]>(() => [
    { key: 'active', label: 'Active Enrollments', value: this.activeCount(), tone: 'success', icon: 'completed' },
    { key: 'credits', label: 'Registered Credits', value: `${this.totalCredits()} Cr`, tone: 'primary', icon: 'completed' },
    { key: 'completed', label: 'Completed Courses', value: this.completedCount(), tone: 'neutral', icon: 'info' },
    { key: 'dropped', label: 'Dropped Courses', value: this.droppedCount(), tone: this.droppedCount() > 0 ? 'danger' : 'neutral', icon: 'failed' }
  ]);

  filteredEnrollments = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const sf = this.statusFilter();
    return this.enrollments().filter(e => {
      const matchesStatus = sf === 'ALL' || e.status === sf;
      const matchesQuery = !q ||
        e.courseName.toLowerCase().includes(q) ||
        e.courseCode.toLowerCase().includes(q) ||
        e.semesterLabel.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  });

  showConfirmDialogue = signal(false);
  enrollmentToDrop = signal<EnrollmentResponse | null>(null);

  confirmMessage = computed(() => {
    const e = this.enrollmentToDrop();
    return e ? `Are you sure you want to drop ${e.courseCode} — ${e.courseName}? This action cannot be undone.` : '';
  });

  constructor(private api: ApiService, private toast: ToastService) {}

  getSyllabusFullUrl(url: string | null): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url}`;
  }

  ngOnInit(): void {
    this.loadEnrollments();
  }

  loadEnrollments(): void {
    this.loading.set(true);
    this.api.getMyEnrollments().subscribe({
      next: (data) => {
        this.enrollments.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load registered courses.');
        this.loading.set(false);
      }
    });
  }

  confirmDrop(e: EnrollmentResponse): void {
    this.enrollmentToDrop.set(e);
    this.showConfirmDialogue.set(true);
  }

  onCancelDrop(): void {
    this.showConfirmDialogue.set(false);
    this.enrollmentToDrop.set(null);
  }

  onConfirmDropModalAction(event: any): void {
    this.showConfirmDialogue.set(false);
    if (event && (event.action === 'confirm' || event.action === 'delete')) {
      this.executeDrop();
    } else {
      this.enrollmentToDrop.set(null);
    }
  }

  executeDrop(): void {
    const e = this.enrollmentToDrop();
    if (!e) return;

    this.enrollmentToDrop.set(null);
    this.droppingId.set(e.id);

    this.api.dropCourse(e.id).subscribe({
      next: () => {
        this.droppingId.set(null);
        this.toast.success(`Successfully dropped ${e.courseCode}`);
        this.loadEnrollments();
      },
      error: (err) => {
        this.droppingId.set(null);
        const msg = err.error?.detail || err.error?.message || 'Failed to drop course.';
        this.toast.error(msg);
      }
    });
  }

}
