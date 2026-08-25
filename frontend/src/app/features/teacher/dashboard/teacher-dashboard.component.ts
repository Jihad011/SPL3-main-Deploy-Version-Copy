import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CourseResponse } from '../../../core/models/models';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToolbarComponent } from '../../../shared/components/toolbar/toolbar.component';
import { listAnimation } from '../../../shared/animations';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, ToolbarComponent, BaseChartDirective],
  animations: [listAnimation],
  template: `
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <p class="page-eyebrow">Faculty Workspace</p>
      <h1 class="page-title">Welcome back, {{ firstName }}</h1>
      <p class="page-subtitle">Review assigned courses and manage student assessment grades.</p>
    </div>
    <div *ngIf="!loading()" class="semester-badge">
      <app-icon name="book-open" [size]="14" />
      {{ courses().length }} Course(s) Assigned
    </div>
  </div>

  <div class="spinner-wrapper" *ngIf="loading()"><div class="spinner"></div></div>

  <app-toolbar
    *ngIf="!loading() && courses().length > 0"
    searchPlaceholder="Search by course name or code…"
    [showViewToggle]="true"
    [defaultView]="'grid'"
    [resultCount]="filtered().length"
    (searchChange)="search.set($event)"
    (viewChange)="view.set($event)"
  />

  <!-- ── Enrollment Statistics ─────────────────────────────────── -->
  <div class="card" *ngIf="!loading() && courses().length > 0" style="margin: 1.5rem 0;">
    <div class="card-header">
      <div>
        <div class="card-title">Enrollment Statistics</div>
        <div class="card-sub">Current capacity vs max seats for your assigned courses</div>
      </div>
    </div>
    <div class="stats-split-layout">
      <div class="chart-container" style="position: relative; height: 260px; width:100%;">
        <canvas baseChart
          [data]="enrollmentChartData"
          [options]="chartOptions"
          [type]="'bar'">
        </canvas>
      </div>
      <div class="stats-data-table" *ngIf="stats() as s">
        <div class="s-row"><span class="s-label">Total Enrollment</span><span class="s-val">{{ s.totalEnrolled }} / {{ s.totalCapacity }}</span></div>
        <div class="s-row"><span class="s-label">Available Seats</span><span class="s-val s-val--highlight">{{ s.totalCapacity - s.totalEnrolled }}</span></div>
        <div class="s-row"><span class="s-label">Seat Utilization</span>
          <div class="s-val-group">
            <div class="s-mini-track"><div class="s-mini-fill" [style.width.%]="s.utilization"></div></div>
            <span class="s-val">{{ s.utilization | number:'1.1-1' }}%</span>
          </div>
        </div>
        <div class="s-row"><span class="s-label">Mean Class Size (<span style="font-family:serif;font-style:italic;">&mu;</span>)</span><span class="s-val">{{ s.mean | number:'1.1-1' }}</span></div>
        <div class="s-row"><span class="s-label">Median Class Size</span><span class="s-val">{{ s.median | number:'1.0-1' }}</span></div>
        <div class="s-row"><span class="s-label">Standard Deviation (<span style="font-family:serif;font-style:italic;">&sigma;</span>)</span><span class="s-val">{{ s.stdDev | number:'1.2-2' }}</span></div>
      </div>
    </div>
  </div>

  <!-- ── Grid View ─────────────────────────────────────── -->
  <div class="courses-grid" *ngIf="!loading() && view() === 'grid'" [@listAnimation]="filtered().length">
    <div class="course-card" *ngFor="let c of filtered()">
      <div class="course-card-header">
        <span class="course-code">{{ c.code }}</span>
        <span class="course-type-badge" [class]="'type-' + c.courseType.toLowerCase()">{{ c.courseType }}</span>
      </div>

      <h3 class="course-name">{{ c.name }}</h3>
      <p class="course-desc" *ngIf="c.description">{{ c.description }}</p>

      <!-- Grading progress -->
      <div class="grading-progress-section">
        <div class="grading-progress-label">
          <span>Enrollment</span>
          <span [style.color]="c.isFull ? 'var(--accent-red)' : 'var(--accent-green)'">
            {{ c.currentEnrollment }}/{{ c.maxSeats }}
          </span>
        </div>
        <div class="seat-bar">
          <div class="seat-fill"
               [style.width.%]="(c.currentEnrollment / c.maxSeats) * 100"
               [style.background]="c.isFull ? 'var(--grad-red)' : 'var(--grad-cyan)'">
          </div>
        </div>
        <span class="seat-text">{{ c.isFull ? 'Course Full' : (c.availableSeats + ' seats available') }}</span>
      </div>

      <div class="course-meta">
        <span class="meta-item"><app-icon name="clock" [size]="14" /> {{ c.creditHours }} credit(s)</span>
      </div>

      <a [routerLink]="['/teacher/grade-entry']" [queryParams]="{ courseId: c.id }"
         class="btn-enroll" style="text-align:center;display:block;text-decoration:none;margin-top:auto">
        Enter grades <app-icon name="arrow-right" [size]="16" />
      </a>
    </div>
  </div>

  <!-- ── List View ─────────────────────────────────────── -->
  <div class="card" *ngIf="!loading() && view() === 'list' && filtered().length > 0">
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Course Name</th>
            <th>Type</th>
            <th>Credits</th>
            <th>Enrollment</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody [@listAnimation]="filtered().length">
          <tr *ngFor="let c of filtered()">
            <td><span class="code-badge">{{ c.code }}</span></td>
            <td><strong>{{ c.name }}</strong></td>
            <td><span class="course-type-badge" [class]="'type-' + c.courseType.toLowerCase()">{{ c.courseType }}</span></td>
            <td>{{ c.creditHours }}</td>
            <td>
              <div class="enrollment-cell">
                <div class="enrollment-mini-bar">
                  <div [style.width.%]="(c.currentEnrollment / c.maxSeats) * 100"
                       [style.background]="c.isFull ? 'var(--grad-red)' : 'var(--grad-cyan)'"></div>
                </div>
                <span [style.color]="c.isFull ? 'var(--accent-red)' : 'var(--accent-green)'">
                  {{ c.currentEnrollment }}/{{ c.maxSeats }}
                </span>
              </div>
            </td>
            <td>
              <span class="status-badge" [class.status-active]="!c.isFull" [class.status-inactive]="c.isFull">
                {{ c.isFull ? 'Full' : 'Open' }}
              </span>
            </td>
            <td>
              <a [routerLink]="['/teacher/grade-entry']" [queryParams]="{ courseId: c.id }"
                 class="btn btn-primary btn-neon" style="white-space:nowrap;font-size:0.86rem;padding:0.55rem 1.1rem;border-radius:var(--radius-sm)">
                Enter Grades
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="empty-state" *ngIf="!loading() && courses().length === 0">
    <div class="empty-icon"><app-icon name="clipboard" [size]="42" /></div>
    <h3>No courses assigned yet</h3>
    <p>Ask the administrator to assign courses to you.</p>
  </div>

  <div class="empty-state" *ngIf="!loading() && courses().length > 0 && filtered().length === 0">
    <div class="empty-icon"><app-icon name="search" [size]="42" /></div>
    <h3>No matching courses</h3>
    <p>Try a different search term.</p>
  </div>
</div>
  `,
  styles: [`
    .grading-progress-section { margin: 0.75rem 0 0.5rem; }
    .grading-progress-label { display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 0.4rem; color: var(--text-muted); }
    .enrollment-cell { display: flex; align-items: center; gap: 0.75rem; }
    .enrollment-mini-bar {
      width: 60px; height: 4px; background: var(--border); border-radius: 4px; overflow: hidden;
    }
    .enrollment-mini-bar > div { height: 100%; border-radius: 4px; transition: width .5s; }

    /* Stats Split Layout */
    .stats-split-layout {
      display: grid;
      grid-template-columns: 2fr 1.2fr;
      gap: 1.5rem;
      align-items: center;
      padding: 0.5rem 1.5rem 1.5rem;
    }
    @media (max-width: 900px) {
      .stats-split-layout { grid-template-columns: 1fr; }
    }
    .stats-data-table {
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .s-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.85rem;
      border-bottom: 1px dashed rgba(255,255,255,0.1);
    }
    .s-row:last-child { border-bottom: none; padding-bottom: 0; }
    .s-label { color: var(--text-secondary); font-size: 0.82rem; font-weight: 500; }
    .s-val { 
      color: var(--text-primary); 
      font-size: 0.95rem; 
      font-weight: 600; 
      font-family: 'Space Grotesk', monospace;
      font-variant-numeric: tabular-nums;
    }
    .s-val--highlight { color: #34d399; }
    .s-val-group { display: flex; align-items: center; gap: 0.75rem; }
    .s-mini-track { width: 50px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; }
    .s-mini-fill { height: 100%; background: #3b82f6; border-radius: 4px; }
  `]
})
export class TeacherDashboardComponent implements OnInit {
  courses = signal<CourseResponse[]>([]);
  loading = signal(true);
  search  = signal('');
  view    = signal<'grid' | 'list'>('grid');

  private auth = inject(AuthStateService);

  get firstName(): string {
    return this.auth.user()?.name?.trim().split(/\s+/)[0] || 'Teacher';
  }

  filtered = computed(() => {
    const q = this.search().toLowerCase();
    if (!q) return this.courses();
    return this.courses().filter(c =>
      c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  });

  stats = computed(() => {
    const courses = this.courses();
    if (courses.length === 0) return null;
    
    const totalEnrolled = courses.reduce((sum, c) => sum + c.currentEnrollment, 0);
    const totalCapacity = courses.reduce((sum, c) => sum + c.maxSeats, 0);
    const utilization = totalCapacity ? (totalEnrolled / totalCapacity) * 100 : 0;
    
    const enrollments = courses.map(c => c.currentEnrollment).sort((a, b) => a - b);
    const mean = totalEnrolled / courses.length;
    
    let median = 0;
    const mid = Math.floor(enrollments.length / 2);
    if (enrollments.length % 2 === 0) {
      median = (enrollments[mid - 1] + enrollments[mid]) / 2;
    } else {
      median = enrollments[mid];
    }
    
    const variance = enrollments.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / courses.length;
    const stdDev = Math.sqrt(variance);

    return { totalEnrolled, totalCapacity, utilization, mean, median, stdDev };
  });

  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#f8fafc', font: { family: 'Outfit', size: 12 } } },
      tooltip: {
        backgroundColor: 'rgba(5, 10, 25, 0.9)',
        titleFont: { family: 'Outfit', size: 14 },
        bodyFont: { family: 'Inter', size: 13 },
        padding: 10,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#71717a', font: { family: 'Inter', size: 11 } }
      },
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#71717a', font: { family: 'Inter', size: 11 } }
      }
    }
  };

  enrollmentChartData: ChartData<'bar'> = {
    labels: [],
    datasets: []
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getTeacherDashboard().subscribe({
      next: (c) => { 
        this.courses.set(c); 
        this.loading.set(false);
        this.updateChartData(c);
      }
    });
  }

  private updateChartData(courses: CourseResponse[]): void {
    const labels = courses.map(c => c.code);
    const current = courses.map(c => c.currentEnrollment);
    const max = courses.map(c => c.maxSeats);
    const available = courses.map(c => c.maxSeats - c.currentEnrollment);

    this.enrollmentChartData = {
      labels: labels,
      datasets: [
        {
          data: current,
          label: 'Currently Enrolled',
          backgroundColor: '#3B82F6', // Blue 500
          hoverBackgroundColor: '#60A5FA',
          borderWidth: 0,
          borderRadius: 4,
          barPercentage: 0.85,
          categoryPercentage: 0.8
        },
        {
          data: available,
          label: 'Available Seats',
          backgroundColor: '#10B981', // Emerald 500
          hoverBackgroundColor: '#34D399',
          borderWidth: 0,
          borderRadius: 4,
          barPercentage: 0.85,
          categoryPercentage: 0.8
        },
        {
          data: max,
          label: 'Max Capacity',
          backgroundColor: '#4F46E5', // Indigo 600
          hoverBackgroundColor: '#6366F1',
          borderWidth: 0,
          borderRadius: 4,
          barPercentage: 0.85,
          categoryPercentage: 0.8
        }
      ]
    };
  }
}
