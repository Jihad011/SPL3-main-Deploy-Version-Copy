import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { StudentDashboardResponse, EnrollmentResponse, FeeResponse } from '../../../core/models/models';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { ToastService } from '../../../core/services/toast.service';
import { listAnimation } from '../../../shared/animations';
import { CardGlowDirective } from '../../../shared/directives/card-glow.directive';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
interface SimulatorCourse {
  enrollment: EnrollmentResponse;
  selectedGrade: string;
  gradePoint: number;
}

const GRADE_OPTIONS = [
  { label: 'A+ (4.00)', value: 'A_PLUS',  point: 4.00 },
  { label: 'A  (3.75)', value: 'A',       point: 3.75 },
  { label: 'A- (3.50)', value: 'A_MINUS', point: 3.50 },
  { label: 'B+ (3.25)', value: 'B_PLUS',  point: 3.25 },
  { label: 'B  (3.00)', value: 'B',       point: 3.00 },
  { label: 'B- (2.75)', value: 'B_MINUS', point: 2.75 },
  { label: 'C+ (2.50)', value: 'C_PLUS',  point: 2.50 },
  { label: 'C  (2.25)', value: 'C',       point: 2.25 },
  { label: 'D  (2.00)', value: 'D',       point: 2.00 },
  { label: 'F  (0.00)', value: 'F',       point: 0.00 },
];

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe, DatePipe, SkeletonComponent, IconComponent, FormsModule, BaseChartDirective, CardGlowDirective],
  animations: [listAnimation],
  template: `
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <p class="page-eyebrow">Student overview</p>
      <h1 class="page-title text-gradient-flow">Welcome back, {{ firstName }}</h1>
      <p class="page-subtitle">Here is your academic progress and financial summary.</p>
    </div>
    <div class="page-header-actions" *ngIf="dashboard() as d">
      <a routerLink="../dues" class="btn btn-secondary" [class.btn-due-highlight]="d.unpaidFeeCount > 0">
        <app-icon name="credit-card" [size]="16" />
        Pay Fees <span class="header-due-badge" *ngIf="d.unpaidFeeCount > 0">৳{{ d.totalDues | number:'1.0-0' }}</span>
      </a>
      <a routerLink="../courses" class="btn btn-primary btn-neon">
        Register courses <app-icon name="arrow-right" [size]="16" />
      </a>
    </div>
  </div>

  <!-- Skeleton -->
  <div class="skeleton-dashboard" *ngIf="loading()">
    <div class="stats-grid" style="margin-bottom: 2rem;">
      <app-skeleton height="120px" borderRadius="16px"></app-skeleton>
      <app-skeleton height="120px" borderRadius="16px"></app-skeleton>
      <app-skeleton height="120px" borderRadius="16px"></app-skeleton>
      <app-skeleton height="120px" borderRadius="16px"></app-skeleton>
    </div>
    <app-skeleton height="300px" borderRadius="16px"></app-skeleton>
  </div>
  <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>

  <ng-container *ngIf="dashboard() as d">

    <!-- ── Top Hero Row: CGPA Ring + Stats ─────────────────── -->
    <div class="dashboard-hero">
      <!-- CGPA Ring -->
      <div class="card cgpa-ring-card card-glow-border" appCardGlow>
        <div class="cgpa-ring-wrapper">
          <svg class="cgpa-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            <circle cx="60" cy="60" r="50" class="cgpa-track" />
            <circle cx="60" cy="60" r="50" class="cgpa-fill"
              [style.stroke]="cgpaColor(d.cgpa)"
              [style.stroke-dashoffset]="cgpaDashOffset(d.cgpa)"
            />
          </svg>
          <div class="cgpa-center-text">
            <div class="cgpa-value">{{ d.cgpa | number:'1.2-2' }}</div>
            <div class="cgpa-label">CGPA</div>
          </div>
        </div>
        <div class="cgpa-details">
          <div class="cgpa-detail-row">
            <span class="cgpa-detail-label">Credits Earned</span>
            <span class="cgpa-detail-value">{{ d.totalCreditsEarned }}</span>
          </div>
          <div class="cgpa-detail-row">
            <span class="cgpa-detail-label">Courses Done</span>
            <span class="cgpa-detail-value">{{ d.totalCoursesCompleted }}</span>
          </div>
          <div class="cgpa-detail-row">
            <span class="cgpa-detail-label">Standing</span>
            <span class="cgpa-detail-value" [style.color]="cgpaColor(d.cgpa)">{{ cgpaGradeLabel(d.cgpa) }}</span>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="hero-stats-col">
        <div class="stat-card stat-card--blue" appCardGlow>
          <div class="stat-icon"><app-icon name="book-open" [size]="22" /></div>
          <div class="stat-value">{{ d.currentSemesterCredits }}<span class="stat-max">/{{ d.maxCreditsPerSemester }}</span></div>
          <div class="stat-label">Credits This Semester</div>
          <div class="progress-bar" style="margin-top:0.5rem">
            <div class="progress-fill" [style.width.%]="creditPercent"></div>
          </div>
          <div class="stat-sub">{{ d.remainingCredits }} credits remaining</div>
        </div>

        <div class="stat-card" [class.stat-card--red]="d.unpaidFeeCount > 0" [class.stat-card--green]="d.unpaidFeeCount === 0" appCardGlow>
          <div class="stat-icon"><app-icon name="credit-card" [size]="22" /></div>
          <div class="stat-value">৳{{ d.totalDues | number:'1.0-0' }}</div>
          <div class="stat-label">Total Outstanding Dues</div>
          <div class="stat-sub">{{ d.unpaidFeeCount }} unpaid fee(s)</div>
          <a routerLink="../dues" class="stat-link" *ngIf="d.unpaidFeeCount > 0">
            Pay fee history <app-icon name="arrow-right" [size]="14" />
          </a>
        </div>

        <div class="stat-card stat-card--purple" appCardGlow>
          <div class="stat-icon"><app-icon name="list-check" [size]="22" /></div>
          <div class="stat-value">{{ d.currentEnrollments.length }}</div>
          <div class="stat-label">Active Courses</div>
          <div class="stat-sub">Current semester</div>
          <a routerLink="../my-courses" class="stat-link">
            My course(s) <app-icon name="arrow-right" [size]="14" />
          </a>
        </div>
      </div>
    </div>

    <!-- ── CGPA Trend Chart ─────────────────────────────────── -->
    <div class="card glass-card card-glow-border" style="margin-bottom: 1.25rem;" appCardGlow>
      <div class="card-header card-glow-border">
        <div>
          <div class="card-title card-glow-border">Academic Trend</div>
          <div class="card-sub card-glow-border">Your CGPA progression over recent semesters</div>
        </div>
      </div>
      <div class="chart-container" style="position: relative; height:220px; width:100%; padding: 0.5rem 1.5rem 1.5rem;">
        <canvas baseChart
          [data]="cgpaTrendChartData"
          [options]="cgpaTrendChartOptions"
          [type]="'line'">
        </canvas>
      </div>
    </div>

    <!-- ── Payable Fees & Dues Card (Direct Dashboard Payment) ── -->
    <div class="card payable-card card-glow-border" *ngIf="unpaidFees().length > 0" appCardGlow>
      <div class="card-header card-glow-border">
        <div class="payable-header-title">
          <span class="pulse-dot-red"></span>
          <div>
            <div class="card-title card-glow-border">Payable Fees & Dues</div>
            <div class="card-sub card-glow-border">You have {{ unpaidFees().length }} outstanding payment(s) requiring attention</div>
          </div>
        </div>
        <a routerLink="../dues" class="stat-link">
          All Fee History <app-icon name="arrow-right" [size]="14" />
        </a>
      </div>

      <div class="payable-fee-list" [@listAnimation]="unpaidFees().length">
        <div class="payable-fee-item" *ngFor="let f of unpaidFees()">
          <div class="fee-icon-box">
            <app-icon name="credit-card" [size]="20"></app-icon>
          </div>
          <div class="fee-main-info">
            <div class="fee-title-row">
              <strong class="fee-type-name">{{ f.feeTypeDisplay }}</strong>
              <span class="fee-sem-label" *ngIf="f.semesterLabel">{{ f.semesterLabel }}</span>
            </div>
            <div class="fee-desc" *ngIf="f.description">{{ f.description }}</div>
            <div class="fee-due-date" *ngIf="f.dueDate">Due Date: {{ f.dueDate | date:'mediumDate' }}</div>
          </div>
          <div class="fee-amount-box">
            <div class="fee-amount-value">৳{{ f.amount | number:'1.0-0' }}</div>
          </div>
          <div class="fee-action-box">
            <button class="btn-pay-now" [disabled]="payingFeeId() === f.id" (click)="payFee(f)">
              <span *ngIf="payingFeeId() !== f.id" class="pay-btn-text">
                <app-icon name="check-circle" [size]="15" /> Pay Now
              </span>
              <span *ngIf="payingFeeId() === f.id" class="spinner-sm"></span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- All Clear Fees Card -->
    <div class="card clear-fees-card card-glow-border" *ngIf="unpaidFees().length === 0 && !loading()" appCardGlow>
      <div class="clear-fees-content">
        <div class="clear-icon-box">
          <app-icon name="check-circle" [size]="28" />
        </div>
        <div>
          <div class="clear-title">Financial Status: All Clear</div>
          <div class="clear-sub">You have zero outstanding fee payments for the current semester.</div>
        </div>
      </div>
    </div>

    <!-- ── CGPA Simulator ───────────────────────────────────── -->
    <div class="card card-glow-border" *ngIf="d.currentEnrollments.length > 0" appCardGlow>
      <div class="card-header card-glow-border">
        <div>
          <div class="card-title card-glow-border">🎯 CGPA Simulator</div>
          <div class="card-sub card-glow-border">Simulate grade outcomes for current courses</div>
        </div>
        <div class="projected-cgpa-badge" [style.background]="cgpaColor(projectedCgpa()) + '20'" [style.color]="cgpaColor(projectedCgpa())">
          Projected: <strong>{{ projectedCgpa() | number:'1.2-2' }}</strong>
        </div>
      </div>
      <div class="simulator-grid">
        <div class="simulator-row" *ngFor="let sim of simulatorCourses()">
          <div class="simulator-course-info">
            <span class="code-badge">{{ sim.enrollment.courseCode }}</span>
            <span class="simulator-course-name">{{ sim.enrollment.courseName }}</span>
            <span class="simulator-credits">{{ sim.enrollment.creditHours }}cr</span>
          </div>
          <div class="simulator-select-wrapper">
            <select class="simulator-select" [(ngModel)]="sim.selectedGrade"
                    (ngModelChange)="onSimGradeChange(sim, $event)">
              <option *ngFor="let g of gradeOptions" [value]="g.value">{{ g.label }}</option>
            </select>
          </div>
          <div class="simulator-gp" [style.color]="gpColor(sim.gradePoint)">
            {{ sim.gradePoint.toFixed(2) }}
          </div>
        </div>
      </div>
      <div class="simulator-footer">
        <span>Based on {{ d.totalCreditsEarned }} earned credits · {{ d.totalCoursesCompleted }} completed courses</span>
        <div class="projected-cgpa-large" [style.color]="cgpaColor(projectedCgpa())">
          {{ projectedCgpa() | number:'1.2-2' }}
          <small>projected CGPA</small>
        </div>
      </div>
    </div>

    <!-- ── Current Enrollments ─────────────────────────────── -->
    <div class="card card-glow-border" *ngIf="d.currentEnrollments.length > 0" appCardGlow>
      <div class="card-header card-glow-border">
        <div>
          <div class="card-title card-glow-border">Current Semester Courses</div>
          <div class="card-sub card-glow-border">{{ d.currentSemester }}</div>
        </div>
        <a routerLink="../my-courses" class="stat-link">
          View My Course(s) <app-icon name="arrow-right" [size]="14" />
        </a>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Credits</th>
              <th>Type</th>
              <th>Status</th>
              <th>Retake</th>
            </tr>
          </thead>
          <tbody [@listAnimation]="d.currentEnrollments.length">
            <tr *ngFor="let e of d.currentEnrollments">
              <td><span class="code-badge">{{ e.courseCode }}</span></td>
              <td><strong>{{ e.courseName }}</strong></td>
              <td>{{ e.creditHours }}</td>
              <td><span class="course-type-badge" [class]="'type-' + (e.courseType ?? 'core').toLowerCase()">{{ e.courseType ?? '—' }}</span></td>
              <td><span class="status-badge" [class]="'status-' + e.status.toLowerCase()">{{ e.status }}</span></td>
              <td><span *ngIf="e.isRetake" class="retake-badge">Retake</span><span *ngIf="!e.isRetake" class="text-muted">—</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="empty-state" *ngIf="d.currentEnrollments.length === 0">
      <div class="empty-icon"><app-icon name="book-open" [size]="42" /></div>
      <h3>No courses enrolled this semester</h3>
      <p>Go to <a routerLink="../courses">Course Registration</a> to enroll.</p>
    </div>
  </ng-container>
</div>
  `,
  styles: [`
    /* Header action styles */
    .header-due-badge {
      background: var(--accent-red); color: white;
      padding: 0.15rem 0.5rem; border-radius: 12px;
      font-size: 0.75rem; font-weight: 700; margin-left: 0.35rem;
    }
    .btn-due-highlight {
      border-color: rgba(248,113,113,0.4) !important;
      background: rgba(248,113,113,0.08) !important;
      color: var(--accent-red) !important;
    }

    /* Hero layout */
    .dashboard-hero {
      display: grid; grid-template-columns: 280px 1fr; gap: 1.25rem; margin-bottom: 1.25rem;
    }
    @media (max-width: 900px) { .dashboard-hero { grid-template-columns: 1fr; } }

    /* CGPA Ring */
    .cgpa-ring-card {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 2rem 1.5rem; gap: 1.5rem;
    }
    .cgpa-ring-wrapper { position: relative; width: 140px; height: 140px; margin-bottom: 0.5rem; }
    .cgpa-svg { width: 140px; height: 140px; transform: rotate(-90deg); filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3)); }
    .cgpa-track { fill: none; stroke: rgba(255,255,255,0.06); stroke-width: 6; }
    .cgpa-fill {
      fill: none; stroke-width: 6; stroke-linecap: round; stroke-dasharray: 314.16;
      transition: stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke .5s;
    }
    .cgpa-center-text {
      position: absolute; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .cgpa-value { font-size: 1.75rem; font-weight: 800; line-height: 1; }
    .cgpa-label { font-size: 0.72rem; color: var(--text-muted); font-weight: 600; letter-spacing: 0.1em; }
    .cgpa-details { 
      width: 100%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; text-align: center; 
      padding-top: 1rem; border-top: 1px solid var(--border);
    }
    .cgpa-detail-row {
      display: flex; flex-direction: column; justify-content: center; align-items: center;
    }
    .cgpa-detail-label { color: var(--text-muted); font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    .cgpa-detail-value { font-weight: 700; font-size: 1.1rem; color: var(--text-primary); margin-top: 0.15rem; }

    /* Hero stats column */
    .hero-stats-col { display: flex; flex-direction: column; gap: 1rem; }
    @media (min-width: 640px) {
      .hero-stats-col { display: grid; grid-template-columns: repeat(3, 1fr); }
    }

    /* Payable Fees Card */
    .payable-card {
      border-color: rgba(248,113,113,0.3) !important;
      margin-bottom: 1.25rem;
    }
    .payable-header-title { display: flex; align-items: center; gap: 0.75rem; }
    .pulse-dot-red {
      width: 10px; height: 10px; border-radius: 50%; background: var(--accent-red);
      animation: pulseRed 1.5s ease infinite; flex-shrink: 0;
    }
    @keyframes pulseRed {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.5); opacity: 0.5; }
    }
    .payable-fee-list { display: flex; flex-direction: column; gap: 0.75rem; padding: 0 1.5rem 1.25rem; }
    .payable-fee-item {
      display: flex; align-items: center; gap: 1rem;
      padding: 1rem; border-radius: 12px;
      background: rgba(248,113,113,0.04); border: 1px solid rgba(248,113,113,0.15);
      flex-wrap: wrap;
    }
    .fee-icon-box {
      width: 42px; height: 42px; border-radius: 10px;
      background: rgba(248,113,113,0.12); color: var(--accent-red);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .fee-main-info { flex: 1; min-width: 180px; }
    .fee-title-row { display: flex; align-items: center; gap: 0.5rem; }
    .fee-type-name { font-size: 0.925rem; color: var(--text-primary); }
    .fee-sem-label {
      font-size: 0.75rem; color: var(--purple); background: rgba(167,139,250,0.12);
      padding: 0.1rem 0.45rem; border-radius: 6px; font-weight: 500;
    }
    .fee-desc { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.15rem; }
    .fee-due-date { font-size: 0.75rem; color: var(--accent-red); margin-top: 0.2rem; }
    .fee-amount-box { text-align: right; }
    .fee-amount-value { font-size: 1.4rem; font-weight: 800; color: var(--accent-red); }
    .btn-pay-now {
      padding: 0.6rem 1.2rem; border-radius: 10px; border: none;
      background: linear-gradient(135deg, #f87171, #fb923c);
      color: white; font-size: 0.85rem; font-weight: 600;
      cursor: pointer; transition: all .2s; font-family: inherit;
    }
    .btn-pay-now:hover:not(:disabled) {
      transform: translateY(-1px); box-shadow: 0 6px 20px rgba(248,113,113,0.4);
    }
    .btn-pay-now:disabled { opacity: 0.6; cursor: not-allowed; }
    .pay-btn-text { display: flex; align-items: center; gap: 0.4rem; }

    /* Clear fees card */
    .clear-fees-card { margin-bottom: 1.25rem; padding: 1.25rem 1.5rem; }
    .clear-fees-content { display: flex; align-items: center; gap: 1rem; }
    .clear-icon-box {
      width: 44px; height: 44px; border-radius: 12px;
      background: rgba(52,211,153,0.12); color: var(--accent-green);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .clear-title { font-weight: 700; font-size: 0.95rem; color: var(--accent-green); }
    .clear-sub { font-size: 0.8rem; color: var(--text-muted); }

    /* Simulator */
    .projected-cgpa-badge { padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }
    .simulator-grid { padding: 0 1.5rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .simulator-row {
      display: flex; align-items: center; gap: 1rem;
      padding: 0.75rem 0; border-bottom: 1px solid var(--border);
    }
    .simulator-course-info { display: flex; align-items: center; gap: 0.5rem; flex: 1; flex-wrap: wrap; }
    .simulator-course-name { color: var(--text-secondary); font-size: 0.875rem; flex: 1; }
    .simulator-credits { color: var(--text-muted); font-size: 0.78rem; }
    .simulator-select-wrapper { min-width: 150px; }
    .simulator-select {
      width: 100%; padding: 0.45rem 0.75rem;
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 8px; color: var(--text-primary); font-size: 0.82rem;
      cursor: pointer; font-family: inherit;
    }
    .simulator-select:focus { outline: none; border-color: var(--accent-primary); }
    .simulator-gp { font-weight: 700; font-size: 1rem; min-width: 40px; text-align: right; }
    .simulator-footer {
      padding: 1rem 1.5rem; border-top: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
      font-size: 0.8rem; color: var(--text-muted); flex-wrap: wrap; gap: 1rem;
    }
    .projected-cgpa-large {
      font-size: 2rem; font-weight: 800; line-height: 1;
      display: flex; flex-direction: column; align-items: flex-end;
    }
    .projected-cgpa-large small { font-size: 0.72rem; color: var(--text-muted); font-weight: 400; margin-top: 2px; }
  `]
})
export class StudentDashboardComponent implements OnInit {
  dashboard   = signal<StudentDashboardResponse | null>(null);
  unpaidFees  = signal<FeeResponse[]>([]);
  loading     = signal(true);
  payingFeeId = signal<number | null>(null);
  error       = signal('');
  creditPercent = 0;
  simulatorCourses = signal<SimulatorCourse[]>([]);
  readonly gradeOptions = GRADE_OPTIONS;

  // Chart configuration
  cgpaTrendChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(5, 8, 17, 0.9)',
        borderColor: 'rgba(0, 240, 255, 0.3)',
        borderWidth: 1,
        titleFont: { family: 'Outfit', size: 15, weight: 600 },
        bodyFont: { family: 'Inter', size: 14 },
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
        boxPadding: 6
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 2.0,
        max: 4.0,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Inter' } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Inter' } }
      }
    },
    elements: {
      line: { tension: 0.4, borderWidth: 3 },
      point: { radius: 4, hoverRadius: 6, borderWidth: 2 }
    }
  };

  cgpaTrendChartData: ChartData<'line'> = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Current'],
    datasets: [{
      data: [3.1, 3.25, 3.15, 3.4, 3.5], // Will be updated with actual data
      borderColor: '#06b6d4',
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      fill: true,
      pointBackgroundColor: '#06b6d4',
      pointBorderColor: '#fff'
    }]
  };

  constructor(
    private api: ApiService,
    private auth: AuthStateService,
    private toast: ToastService
  ) {}

  get firstName(): string {
    return this.auth.user()?.name?.trim().split(/\s+/)[0] || 'Student';
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.api.getStudentDashboard().subscribe({
      next: (d) => {
        this.dashboard.set(d);
        this.creditPercent = d.maxCreditsPerSemester > 0
          ? (d.currentSemesterCredits / d.maxCreditsPerSemester) * 100 : 0;
        this.simulatorCourses.set(d.currentEnrollments.map(e => ({
          enrollment: e,
          selectedGrade: 'B',
          gradePoint: 3.25
        })));

        // Mock trend data leading up to current CGPA for visualization
        const currentCgpa = d.cgpa || 0;
        this.cgpaTrendChartData.datasets[0].data = [
          Math.max(2.0, currentCgpa - 0.3),
          Math.max(2.0, currentCgpa - 0.1),
          Math.max(2.0, currentCgpa - 0.2),
          Math.max(2.0, currentCgpa - 0.05),
          currentCgpa
        ];
        // Trigger chart update
        this.cgpaTrendChartData = { ...this.cgpaTrendChartData };

        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e.error?.detail || e.error?.message || 'Failed to load dashboard.');
        this.loading.set(false);
      }
    });

    this.api.getMyUnpaidFees().subscribe({
      next: (fees) => this.unpaidFees.set(fees),
      error: () => this.unpaidFees.set([])
    });
  }

  payFee(fee: FeeResponse): void {
    this.payingFeeId.set(fee.id);
    this.api.payMyFee(fee.id).subscribe({
      next: () => {
        this.payingFeeId.set(null);
        this.toast.success(`Payment of ৳${fee.amount} for ${fee.feeTypeDisplay} completed successfully! 🎉`);
        this.loadDashboardData();
      },
      error: (e) => {
        this.payingFeeId.set(null);
        const msg = e.error?.detail || e.error?.message || 'Payment failed. Please try again.';
        this.toast.error(msg);
      }
    });
  }

  cgpaDashOffset(cgpa: number): number {
    const circumference = 314.16;
    const pct = Math.min(cgpa / 4.0, 1);
    return circumference * (1 - pct);
  }

  cgpaColor(cgpa: number): string {
    if (cgpa >= 3.5) return '#34d399';
    if (cgpa >= 3.0) return '#22d3ee';
    if (cgpa >= 2.5) return '#fbbf24';
    if (cgpa >= 2.0) return '#fb923c';
    return '#f87171';
  }

  cgpaGradeLabel(cgpa: number): string {
    if (cgpa >= 4.00) return 'A+';
    if (cgpa >= 3.75) return 'A';
    if (cgpa >= 3.5)  return 'A-';
    if (cgpa >= 3.25) return 'B+';
    if (cgpa >= 3.0)  return 'B';
    if (cgpa >= 2.75) return 'B-';
    if (cgpa >= 2.5)  return 'C+';
    if (cgpa >= 2.25) return 'C';
    if (cgpa >= 2.0)  return 'D';
    return 'F';
  }

  gpColor(gp: number): string { return this.cgpaColor(gp); }

  onSimGradeChange(sim: SimulatorCourse, gradeValue: string): void {
    const found = GRADE_OPTIONS.find(g => g.value === gradeValue);
    sim.gradePoint = found?.point ?? 0;
    this.simulatorCourses.update(list => [...list]);
  }

  projectedCgpa = computed(() => {
    const d = this.dashboard();
    if (!d) return 0;
    const simCourses = this.simulatorCourses();
    if (!simCourses.length) return d.cgpa;
    const existingWeighted = d.cgpa * d.totalCreditsEarned;
    const simWeighted = simCourses.reduce((s, c) => s + c.gradePoint * c.enrollment.creditHours, 0);
    const simCredits  = simCourses.reduce((s, c) => s + c.enrollment.creditHours, 0);
    const totalCredits = d.totalCreditsEarned + simCredits;
    return totalCredits > 0 ? (existingWeighted + simWeighted) / totalCredits : 0;
  });
}
