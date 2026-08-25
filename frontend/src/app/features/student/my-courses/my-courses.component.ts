import { Component, OnInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { EnrollmentResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToolbarComponent } from '../../../shared/components/toolbar/toolbar.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, IconComponent, ToolbarComponent, ConfirmModalComponent],
  template: `
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-eyebrow">Academic Enrollment</div>
      <h1 class="page-title">My Course(s)</h1>
      <p class="page-subtitle">View and manage your registered courses for all semesters</p>
    </div>
    <div class="header-actions">
      <div class="metric-chip metric-chip--green" *ngIf="!loading()">
        <app-icon name="book-open" [size]="15"></app-icon>
        {{ activeCount() }} active course(s) · {{ totalCredits() }} credit(s)
      </div>
      <a routerLink="../courses" class="btn btn-primary">
        <app-icon name="book-open" [size]="15" /> Course Enrollment
      </a>
    </div>
  </div>

  <div class="spinner-wrapper" *ngIf="loading()"><div class="spinner"></div></div>

  <!-- Summary Cards -->
  <div class="stats-grid" *ngIf="!loading() && enrollments().length > 0">
    <div class="stat-card stat-card--blue">
      <div class="stat-icon"><app-icon name="list-check" [size]="22"></app-icon></div>
      <div class="stat-value">{{ activeCount() }}</div>
      <div class="stat-label">Active Enrollments</div>
    </div>
    <div class="stat-card stat-card--purple">
      <div class="stat-icon"><app-icon name="clock" [size]="22"></app-icon></div>
      <div class="stat-value">{{ totalCredits() }}</div>
      <div class="stat-label">Total Registered Credits</div>
    </div>
    <div class="stat-card stat-card--green">
      <div class="stat-icon"><app-icon name="check-circle" [size]="22"></app-icon></div>
      <div class="stat-value">{{ completedCount() }}</div>
      <div class="stat-label">Completed Courses</div>
    </div>
    <div class="stat-card stat-card--red" *ngIf="droppedCount() > 0">
      <div class="stat-icon"><app-icon name="alert-triangle" [size]="22"></app-icon></div>
      <div class="stat-value">{{ droppedCount() }}</div>
      <div class="stat-label">Dropped Courses</div>
    </div>
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
        <span class="code-badge">{{ e.courseCode }}</span>
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

      <!-- Schedule pill -->
      <div class="schedule-pill-row">
        <span class="schedule-pill">
          <app-icon name="clock" [size]="12"></app-icon> Mon & Wed · 10:00 AM - 11:30 AM
        </span>
      </div>

      <div class="enrolled-date-row">
        Enrolled on {{ e.enrolledAt | date:'mediumDate' }}
      </div>

      <div class="card-action-bar" *ngIf="e.status === 'ACTIVE'">
        <button class="btn-drop" [disabled]="droppingId() === e.id" (click)="confirmDrop(e)">
          <app-icon name="x" [size]="15" *ngIf="droppingId() !== e.id"></app-icon>
          <span class="spinner-sm" *ngIf="droppingId() === e.id"></span>
          {{ droppingId() === e.id ? 'Dropping...' : 'Drop Course' }}
        </button>
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
            <td><span class="code-badge">{{ e.courseCode }}</span></td>
            <td><strong>{{ e.courseName }}</strong></td>
            <td>{{ e.creditHours }}</td>
            <td>{{ e.semesterLabel }}</td>
            <td>
              <span class="retake-badge" *ngIf="e.isRetake">Retake</span>
              <span class="text-muted" *ngIf="!e.isRetake">Regular</span>
            </td>
            <td class="table-date">{{ e.enrolledAt | date:'mediumDate' }}</td>
            <td>
              <span class="status-badge" [class]="'status-' + e.status.toLowerCase()">
                {{ e.status }}
              </span>
            </td>
            <td>
              <button class="btn-drop-sm" *ngIf="e.status === 'ACTIVE'"
                      [disabled]="droppingId() === e.id" (click)="confirmDrop(e)">
                {{ droppingId() === e.id ? 'Dropping...' : 'Drop' }}
              </button>
              <span class="text-muted" *ngIf="e.status !== 'ACTIVE'">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Empty state -->
  <div class="empty-state" *ngIf="!loading() && enrollments().length === 0">
    <div class="empty-icon"><app-icon name="book-open" [size]="42" /></div>
    <h3>No courses enrolled yet</h3>
    <p>You haven't enrolled in any courses. Head over to Course Enrollment to view available offerings.</p>
    <a routerLink="../courses" class="btn btn-primary btn-neon" style="margin-top: 1rem">
      Go to Course Enrollment
    </a>
  </div>

  <div class="empty-state" *ngIf="!loading() && enrollments().length > 0 && filteredEnrollments().length === 0">
    <div class="empty-icon"><app-icon name="search" [size]="42" /></div>
    <h3>No matching courses</h3>
    <p>Try clearing your search term or selecting a different status filter.</p>
  </div>
  
  <app-confirm-modal
    [title]="'Drop Course'"
    [message]="confirmMessage()"
    confirmText="Drop Course"
    cancelText="Cancel"
    type="danger"
    (confirm)="executeDrop()"
  ></app-confirm-modal>
</div>
  `,
  styles: [`
    .header-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
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
    .dot-active, .dot-completed, .dot-dropped {
      width: 8px; height: 8px; border-radius: 50%; display: inline-block;
    }
    .dot-active    { background: var(--accent-green); }
    .dot-completed { background: var(--accent-primary); }
    .dot-dropped   { background: var(--accent-red); }

    .my-course-card {
      display: flex; flex-direction: column; height: 100%;
    }
    .card-dropped { opacity: 0.65; }
    .row-dropped td { opacity: 0.6; }
    .enrolled-date-row {
      font-size: 0.775rem; color: var(--text-muted); margin-top: auto; padding-top: 0.75rem;
    }
    .card-action-bar { margin-top: 0.75rem; }
    .btn-drop {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.75rem 1rem; border-radius: var(--radius);
      background: rgba(239, 68, 68, 0.05); border: 1px dashed rgba(239, 68, 68, 0.3);
      color: #ef4444; font-size: 0.9rem; font-weight: 600;
      cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); font-family: 'Inter', sans-serif;
    }
    .btn-drop:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.15); border-color: #ef4444;
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.15);
    }
    .btn-drop:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .btn-drop-sm {
      padding: 0.4rem 0.75rem; border-radius: 6px;
      background: rgba(239, 68, 68, 0.05); border: 1px dashed rgba(239, 68, 68, 0.3);
      color: #ef4444; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; transition: all 0.3s; font-family: 'Inter', sans-serif;
    }
    .schedule-pill-row {
      margin-top: 0.25rem;
    }
    .schedule-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.6rem;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      font-size: 0.75rem;
      border-radius: var(--radius-xs);
      font-weight: 600;
    }
    .btn-drop-sm:hover:not(:disabled) { 
      background: rgba(239, 68, 68, 0.15); 
      border-color: #ef4444;
    }
  `]
})
export class MyCoursesComponent implements OnInit {
  enrollments = signal<EnrollmentResponse[]>([]);
  loading     = signal(true);
  droppingId  = signal<number | null>(null);
  searchQuery = signal('');
  statusFilter = signal<string>('ALL');
  view        = signal<'grid' | 'list'>('grid');

  activeCount = computed(() => this.enrollments().filter(e => e.status === 'ACTIVE').length);
  completedCount = computed(() => this.enrollments().filter(e => e.status === 'COMPLETED').length);
  droppedCount = computed(() => this.enrollments().filter(e => e.status === 'DROPPED').length);

  totalCredits = computed(() =>
    this.enrollments()
      .filter(e => e.status === 'ACTIVE' || e.status === 'COMPLETED')
      .reduce((sum, e) => sum + e.creditHours, 0)
  );

  filteredEnrollments = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const sf = this.statusFilter();
    return this.enrollments().filter(e => {
      const matchesStatus = sf === 'ALL' || e.status === sf;
      const matchesQuery  = !q ||
        e.courseName.toLowerCase().includes(q) ||
        e.courseCode.toLowerCase().includes(q) ||
        e.semesterLabel.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  });

  @ViewChild(ConfirmModalComponent) confirmModal!: ConfirmModalComponent;
  enrollmentToDrop = signal<EnrollmentResponse | null>(null);
  confirmMessage = computed(() => {
    const e = this.enrollmentToDrop();
    if (!e) return '';
    return `Are you sure you want to drop ${e.courseCode} — ${e.courseName}? This action cannot be undone.`;
  });

  constructor(private api: ApiService, private toast: ToastService) {}

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
    this.confirmModal.open();
  }
  
  executeDrop(): void {
    const e = this.enrollmentToDrop();
    if (!e) return;
    
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
