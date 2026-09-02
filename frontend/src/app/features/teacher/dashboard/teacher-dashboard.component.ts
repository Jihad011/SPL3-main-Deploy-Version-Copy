import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CourseResponse } from '../../../core/models/models';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToolbarComponent } from '../../../shared/components/toolbar/toolbar.component';
import { listAnimation } from '../../../shared/animations';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

// CenterPoint Shared Components
import {
  SummaryCardStrip,
  SummaryCardItem,
  GenericButton
} from '../../../shared';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    ToolbarComponent,
    BaseChartDirective,
    SummaryCardStrip,
    GenericButton,
    DecimalPipe
  ],
  animations: [listAnimation],
  template: `
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <p class="page-eyebrow">Faculty Academic Workspace</p>
      <h1 class="page-title">Welcome back, {{ firstName }}</h1>
      <p class="page-subtitle">Review assigned academic courses and manage student assessment grade sheets.</p>
    </div>
    <div class="header-actions">
      <div *ngIf="!loading()" class="metric-chip metric-chip--green font-mono">
        <app-icon name="book-open" [size]="14" />
        {{ courses().length }} Course(s) Assigned
      </div>
    </div>
  </div>

  <div class="spinner-wrapper" *ngIf="loading()"><div class="spinner"></div></div>

  <!-- CenterPoint Summary Card Strip -->
  <div style="margin-bottom: 1.5rem;" *ngIf="!loading() && courses().length > 0">
    <app-summary-card-strip [items]="summaryItems()" displayMode="page" />
  </div>

  <app-toolbar
    *ngIf="!loading() && courses().length > 0"
    searchPlaceholder="Search by course name or code…"
    [showViewToggle]="true"
    [defaultView]="'grid'"
    [resultCount]="filtered().length"
    (searchChange)="search.set($event)"
    (viewChange)="view.set($event)"
  />

  <!-- Enrollment Statistics Card -->
  <div class="card" *ngIf="!loading() && courses().length > 0" style="margin: 1.25rem 0;">
    <div class="card-header">
      <div>
        <div class="card-title">Enrollment Statistics & Seat Utilization</div>
        <div class="card-sub">Current capacity vs max seats across assigned academic courses</div>
      </div>
    </div>
    <div class="stats-split-layout">
      <div class="chart-container" style="position: relative; height: 240px; width:100%;">
        <canvas baseChart
          [data]="enrollmentChartData"
          [options]="chartOptions"
          [type]="'bar'">
        </canvas>
      </div>
      <div class="stats-data-table" *ngIf="stats() as s">
        <div class="s-row"><span class="s-label">Total Enrollment</span><span class="s-val font-mono">{{ s.totalEnrolled }} / {{ s.totalCapacity }}</span></div>
        <div class="s-row"><span class="s-label">Available Seats</span><span class="s-val s-val--highlight font-mono">{{ s.totalCapacity - s.totalEnrolled }}</span></div>
        <div class="s-row"><span class="s-label">Seat Utilization</span>
          <div class="s-val-group">
            <div class="s-mini-track"><div class="s-mini-fill" [style.width.%]="s.utilization"></div></div>
            <span class="s-val font-mono">{{ s.utilization | number:'1.1-1' }}%</span>
          </div>
        </div>
        <div class="s-row"><span class="s-label">Mean Class Size (&mu;)</span><span class="s-val font-mono">{{ s.mean | number:'1.1-1' }}</span></div>
        <div class="s-row"><span class="s-label">Standard Deviation (&sigma;)</span><span class="s-val font-mono">{{ s.stdDev | number:'1.2-2' }}</span></div>
      </div>
    </div>
  </div>

  <!-- Grid View -->
  <div class="courses-grid" *ngIf="!loading() && view() === 'grid'" [@listAnimation]="filtered().length">
    <div class="course-card" *ngFor="let c of filtered()">
      <div class="course-card-header">
        <span class="code-badge font-mono">{{ c.code }}</span>
        <span class="course-type-badge" [class]="'type-' + c.courseType.toLowerCase()">{{ c.courseType }}</span>
      </div>

      <h3 class="course-name">{{ c.name }}</h3>
      <p class="course-desc" *ngIf="c.description">{{ c.description }}</p>

      <div class="seat-info">
        <div class="seat-bar">
          <div class="seat-fill"
               [style.width.%]="(c.currentEnrollment / c.maxSeats) * 100"
               [style.background]="c.isFull ? '#ef4444' : '#22d3ee'">
          </div>
        </div>
        <div class="seat-text-row">
          <span>Enrolled Students</span>
          <span class="font-mono font-bold">{{ c.currentEnrollment }} / {{ c.maxSeats }}</span>
        </div>
      </div>

      <div class="course-card-footer">
        <a [routerLink]="['../grade-entry']" [queryParams]="{ courseId: c.id }" class="btn-grade font-mono font-semibold">
          <app-icon name="edit" [size]="14" />
          <span>Enter Marks & Grades</span>
        </a>
      </div>
    </div>
  </div>

  <!-- List View -->
  <div class="card" *ngIf="!loading() && view() === 'list' && filtered().length > 0">
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Course Code</th>
            <th>Course Title</th>
            <th>Type</th>
            <th>Credits</th>
            <th>Enrolled Students</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let c of filtered()">
            <td><span class="code-badge font-mono">{{ c.code }}</span></td>
            <td><strong>{{ c.name }}</strong></td>
            <td><span class="course-type-badge" [class]="'type-' + c.courseType.toLowerCase()">{{ c.courseType }}</span></td>
            <td>{{ c.creditHours }} Cr</td>
            <td>
              <span class="font-mono font-semibold" [style.color]="c.isFull ? '#ef4444' : '#10b981'">
                {{ c.currentEnrollment }} / {{ c.maxSeats }}
              </span>
            </td>
            <td>
              <a [routerLink]="['../grade-entry']" [queryParams]="{ courseId: c.id }" class="btn btn-primary btn-sm">
                <app-icon name="edit" [size]="14" /> Enter Grades
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="empty-state" *ngIf="!loading() && filtered().length === 0">
    <div class="empty-icon"><app-icon name="book-open" [size]="28" /></div>
    <h3>No courses assigned</h3>
    <p>You currently do not have courses assigned for this active academic term.</p>
  </div>
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
    .stats-split-layout {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 1.5rem;
      padding: 1.25rem;
    }
    @media (max-width: 800px) {
      .stats-split-layout { grid-template-columns: 1fr; }
    }
    .stats-data-table {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      justify-content: center;
      background: var(--bg-elevated);
      padding: 1rem;
      border-radius: 10px;
      border: 1px solid var(--border);
    }
    .s-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
    }
    .s-label { color: var(--text-secondary); }
    .s-val { font-weight: 700; color: var(--text-primary); }
    .s-val--highlight { color: #10b981; }
    .s-val-group { display: flex; align-items: center; gap: 0.5rem; }
    .s-mini-track { width: 60px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
    .s-mini-fill { height: 100%; background: var(--accent-primary); }

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
    .course-card-header { display: flex; justify-content: space-between; align-items: center; }
    .course-name { font-size: 1.05rem; font-weight: 700; margin: 0; color: var(--text-primary); }
    .course-desc { font-size: 0.82rem; color: var(--text-muted); margin: 0; }
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
    .seat-text-row { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); }
    .course-card-footer { margin-top: auto; padding-top: 0.5rem; }
    .btn-grade {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      width: 100%;
      padding: 0.55rem;
      border-radius: 8px;
      background: linear-gradient(135deg, #086AD8, #2563eb);
      color: #ffffff;
      text-decoration: none;
      font-size: 0.85rem;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(8, 106, 216, 0.3);
    }
    .btn-grade:hover {
      background: linear-gradient(135deg, #0456b8, #1d4ed8);
      color: #ffffff;
      opacity: 1;
    }
  `]
})
export class TeacherDashboardComponent implements OnInit {
  courses = signal<CourseResponse[]>([]);
  loading = signal(true);
  search = signal('');
  view = signal<'grid' | 'list'>('grid');

  private api = inject(ApiService);
  private auth = inject(AuthStateService);

  get firstName(): string {
    return this.auth.user()?.name?.split(' ')[0] || 'Professor';
  }

  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return !q ? this.courses() : this.courses().filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  });

  stats = computed(() => {
    const list = this.courses();
    if (!list.length) return null;
    const totalEnrolled = list.reduce((s, c) => s + (c.currentEnrollment || 0), 0);
    const totalCapacity = list.reduce((s, c) => s + (c.maxSeats || 0), 0);
    const utilization = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;
    const enrollments = list.map(c => c.currentEnrollment || 0).sort((a, b) => a - b);
    const mean = totalEnrolled / list.length;
    const median = enrollments.length % 2 === 0
      ? (enrollments[enrollments.length / 2 - 1] + enrollments[enrollments.length / 2]) / 2
      : enrollments[Math.floor(enrollments.length / 2)];
    const variance = list.reduce((sum, c) => sum + Math.pow((c.currentEnrollment || 0) - mean, 2), 0) / list.length;
    const stdDev = Math.sqrt(variance);

    return { totalEnrolled, totalCapacity, utilization, mean, median, stdDev };
  });

  summaryItems = computed<SummaryCardItem[]>(() => {
    const s = this.stats();
    return [
      { key: 'courses', label: 'Assigned Courses', value: this.courses().length, tone: 'primary', icon: 'completed' },
      { key: 'enrolled', label: 'Enrolled Students', value: s?.totalEnrolled || 0, tone: 'success', icon: 'completed' },
      { key: 'util', label: 'Seat Utilization', value: `${(s?.utilization || 0).toFixed(1)}%`, tone: 'warning', icon: 'pause' }
    ];
  });

  enrollmentChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Enrolled', backgroundColor: '#22d3ee', borderRadius: 4 },
      { data: [], label: 'Capacity', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4 }
    ]
  };

  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } }
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.api.getMyCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.enrollmentChartData = {
          labels: courses.map(c => c.code),
          datasets: [
            { data: courses.map(c => c.currentEnrollment || 0), label: 'Enrolled', backgroundColor: '#22d3ee', borderRadius: 4 },
            { data: courses.map(c => c.maxSeats || 0), label: 'Capacity', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4 }
          ]
        };
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
