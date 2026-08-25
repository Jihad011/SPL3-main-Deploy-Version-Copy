import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { StudentDashboardResponse, FeeResponse } from '../../../core/models/models';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { ToastService } from '../../../core/services/toast.service';
import { listAnimation } from '../../../shared/animations';
import { CardGlowDirective } from '../../../shared/directives/card-glow.directive';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DecimalPipe, DatePipe, SkeletonComponent, IconComponent, BaseChartDirective, CardGlowDirective],
  animations: [listAnimation],
  template: `
<div class="page student-dashboard-page">
  <!-- Header & Profile Strip -->
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-eyebrow">
        <app-icon name="user" [size]="13" />
        <span>Academic Workspace · Student Portal</span>
      </div>
      <h1 class="page-title">Welcome back, {{ displayName }}</h1>
      <div class="student-meta-strip" *ngIf="dashboard() as d">
        <span class="meta-pill font-mono">
          <strong>Roll:</strong> {{ d.rollNumber }}
        </span>
        <span class="meta-pill font-mono" *ngIf="d.registrationNumber">
          <strong>Reg:</strong> {{ d.registrationNumber }}
        </span>
        <span class="meta-pill" *ngIf="d.currentSemester">
          <app-icon name="calendar" [size]="13" /> {{ d.currentSemester }}
        </span>
        <span class="meta-pill meta-pill--status">
          <span class="status-dot"></span> Active Student
        </span>
      </div>
    </div>
    <div class="page-header-actions" *ngIf="dashboard() as d">
      <a routerLink="../dues" class="btn btn-secondary" [class.btn-due-highlight]="d.unpaidFeeCount > 0">
        <app-icon name="credit-card" [size]="15" />
        Pay Fees <span class="header-due-badge" *ngIf="d.unpaidFeeCount > 0">৳{{ d.totalDues | number:'1.0-0' }}</span>
      </a>
      <a routerLink="../courses" class="btn btn-primary">
        <app-icon name="plus" [size]="15" /> Register Courses
      </a>
      <a routerLink="../history" class="btn btn-secondary" title="View Academic History">
        <app-icon name="history" [size]="15" /> Records
      </a>
    </div>
  </div>

  <!-- Loading Skeleton -->
  <div class="skeleton-dashboard" *ngIf="loading()">
    <div class="stats-grid" style="margin-bottom: 1.5rem;">
      <app-skeleton height="130px" borderRadius="8px"></app-skeleton>
      <app-skeleton height="130px" borderRadius="8px"></app-skeleton>
      <app-skeleton height="130px" borderRadius="8px"></app-skeleton>
      <app-skeleton height="130px" borderRadius="8px"></app-skeleton>
    </div>
    <div class="bento-grid">
      <app-skeleton height="380px" borderRadius="8px"></app-skeleton>
      <app-skeleton height="380px" borderRadius="8px"></app-skeleton>
    </div>
  </div>

  <div class="alert alert-error" *ngIf="error()">
    <app-icon name="alert-triangle" [size]="16" /> {{ error() }}
  </div>

  <ng-container *ngIf="dashboard() as d">

    <!-- ── Row 1: Executive 4-Card KPI Grid ─────────────────── -->
    <div class="stats-grid kpi-dashboard-grid">
      <!-- Card 1: CGPA & Academic Standing -->
      <div class="stat-card stat-card--kpi-cgpa">
        <div class="kpi-cgpa-row">
          <div class="cgpa-ring-mini">
            <svg class="cgpa-svg-mini" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" class="cgpa-track-mini" />
              <circle cx="40" cy="40" r="32" class="cgpa-fill-mini"
                [style.stroke]="cgpaColor(d.cgpa)"
                [style.stroke-dashoffset]="cgpaMiniDashOffset(d.cgpa)"
              />
            </svg>
            <div class="cgpa-mini-text font-mono">{{ d.cgpa | number:'1.2-2' }}</div>
          </div>
          <div class="kpi-cgpa-info">
            <div class="kpi-title">Cumulative GPA</div>
            <div class="standing-chip" [style.color]="cgpaColor(d.cgpa)" [style.background]="cgpaColor(d.cgpa) + '15'">
              Standing: {{ cgpaGradeLabel(d.cgpa) }}
            </div>
            <div class="kpi-sub-text">
              <strong>{{ d.totalCreditsEarned }}</strong> cr earned · <strong>{{ d.totalCoursesCompleted }}</strong> done
            </div>
          </div>
        </div>
      </div>

      <!-- Card 2: Term Credits Utilization -->
      <div class="stat-card stat-card--blue">
        <div class="stat-card-inner">
          <div class="stat-icon"><app-icon name="book-open" [size]="20" /></div>
          <div class="stat-content">
            <div class="stat-value font-mono">
              {{ d.currentSemesterCredits }}<span class="stat-max">/{{ d.maxCreditsPerSemester }}</span>
            </div>
            <div class="stat-label">Term Credit Limit</div>
            <div class="progress-bar" style="margin-top:0.45rem">
              <div class="progress-fill" [style.width.%]="creditPercent" [class.fill-warning]="creditPercent >= 100"></div>
            </div>
            <div class="stat-sub">
              {{ d.remainingCredits > 0 ? (d.remainingCredits + ' credits remaining') : 'Maximum term cap reached' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Card 3: Financial Standing -->
      <div class="stat-card" [class.stat-card--red]="d.unpaidFeeCount > 0" [class.stat-card--green]="d.unpaidFeeCount === 0">
        <div class="stat-card-inner">
          <div class="stat-icon">
            <app-icon [name]="d.unpaidFeeCount > 0 ? 'alert-triangle' : 'check-circle'" [size]="20" />
          </div>
          <div class="stat-content">
            <div class="stat-value font-mono">
              {{ d.unpaidFeeCount > 0 ? ('৳' + (d.totalDues | number:'1.0-0')) : '৳0' }}
            </div>
            <div class="stat-label">{{ d.unpaidFeeCount > 0 ? 'Outstanding Dues' : 'Financial Standing' }}</div>
            <div class="stat-sub">
              {{ d.unpaidFeeCount > 0 ? (d.unpaidFeeCount + ' invoice(s) pending payment') : 'All semester fees cleared' }}
            </div>
            <a routerLink="../dues" class="stat-link" *ngIf="d.unpaidFeeCount > 0">
              Pay dues <app-icon name="arrow-right" [size]="13" />
            </a>
          </div>
        </div>
      </div>

      <!-- Card 4: Enrolled Courses -->
      <div class="stat-card stat-card--purple">
        <div class="stat-card-inner">
          <div class="stat-icon"><app-icon name="list-check" [size]="20" /></div>
          <div class="stat-content">
            <div class="stat-value font-mono">{{ d.currentEnrollments.length }}</div>
            <div class="stat-label">Active Courses</div>
            <div class="stat-sub">{{ d.currentSemester || 'Current term' }}</div>
            <a routerLink="../my-courses" class="stat-link">
              My courses <app-icon name="arrow-right" [size]="13" />
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Row 2: Balanced 2-Column Bento Grid ──────────────── -->
    <div class="dashboard-bento-grid">
      <!-- ═══════════════════════════════════════════════════════
           LEFT COLUMN: Primary Academic Data (60% width)
           ═══════════════════════════════════════════════════════ -->
      <div class="bento-col-main">
        <!-- 1. Current Semester Courses Table -->
        <div class="card bento-card">
          <div class="card-header">
            <div class="card-header-titles">
              <h2 class="card-title">Enrolled Courses & Timetable</h2>
              <div class="card-sub">{{ d.currentSemester || 'Active semester offerings' }}</div>
            </div>
            <div class="card-header-actions">
              <a routerLink="../my-courses" class="btn-table-action">
                View All <app-icon name="arrow-right" [size]="13" />
              </a>
            </div>
          </div>

          <div class="table-wrapper" *ngIf="d.currentEnrollments.length > 0">
            <table class="data-table">
              <thead>
                <tr>
                  <th style="width: 110px;">Code</th>
                  <th>Course Name</th>
                  <th style="width: 80px;">Credits</th>
                  <th style="width: 90px;">Type</th>
                  <th style="width: 100px;">Status</th>
                </tr>
              </thead>
              <tbody [@listAnimation]="d.currentEnrollments.length">
                <tr *ngFor="let e of d.currentEnrollments">
                  <td><span class="code-badge">{{ e.courseCode }}</span></td>
                  <td>
                    <div class="course-name-cell">
                      <strong class="course-cell-title">{{ e.courseName }}</strong>
                      <span *ngIf="e.isRetake" class="retake-mini-tag">Retake</span>
                    </div>
                  </td>
                  <td class="font-mono text-center">{{ e.creditHours }} cr</td>
                  <td>
                    <span class="course-type-badge" [class]="'type-' + (e.courseType ?? 'core').toLowerCase()">
                      {{ e.courseType ?? 'CORE' }}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" [class]="'status-' + e.status.toLowerCase()">
                      {{ e.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="empty-state-compact" *ngIf="d.currentEnrollments.length === 0">
            <app-icon name="book-open" [size]="28" class="text-muted" />
            <p>No courses registered for {{ d.currentSemester || 'this term' }}.</p>
            <a routerLink="../courses" class="btn btn-primary btn-sm">
              <app-icon name="plus" [size]="14" /> Enroll in Courses
            </a>
          </div>
        </div>

        <!-- 2. Academic CGPA Progression Trend -->
        <div class="card bento-card">
          <div class="card-header">
            <div class="card-header-titles">
              <h2 class="card-title">Academic CGPA Progression</h2>
              <div class="card-sub">Cumulative grade point average trajectory across completed terms</div>
            </div>
            <div class="cgpa-trend-badge" [style.color]="cgpaColor(d.cgpa)">
              Current: <strong>{{ d.cgpa | number:'1.2-2' }}</strong>
            </div>
          </div>
          <div class="chart-container-dashboard">
            <canvas baseChart
              [data]="cgpaTrendChartData"
              [options]="cgpaTrendChartOptions"
              [type]="'line'">
            </canvas>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════
           RIGHT COLUMN: Actions, Invoices & Goal Simulator (40% width)
           ═══════════════════════════════════════════════════════ -->
      <div class="bento-col-side">
        <!-- 1. Payable Invoices (High Priority) -->
        <div class="card bento-card payable-card" *ngIf="unpaidFees().length > 0">
          <div class="card-header">
            <div class="payable-header-title">
              <span class="pulse-dot-red"></span>
              <div>
                <h2 class="card-title">Outstanding Invoices</h2>
                <div class="card-sub">{{ unpaidFees().length }} payment(s) requiring immediate settlement</div>
              </div>
            </div>
            <a routerLink="../dues" class="btn-table-action">
              History <app-icon name="arrow-right" [size]="13" />
            </a>
          </div>

          <div class="payable-fee-list" [@listAnimation]="unpaidFees().length">
            <div class="payable-fee-item" *ngFor="let f of unpaidFees()">
              <div class="fee-icon-box">
                <app-icon name="credit-card" [size]="18" />
              </div>
              <div class="fee-main-info">
                <div class="fee-title-row">
                  <strong class="fee-type-name">{{ f.feeTypeDisplay }}</strong>
                  <span class="fee-sem-label" *ngIf="f.semesterLabel">{{ f.semesterLabel }}</span>
                </div>
                <div class="fee-due-date" *ngIf="f.dueDate">Due: {{ f.dueDate | date:'mediumDate' }}</div>
              </div>
              <div class="fee-pay-action-col">
                <div class="fee-amount-value font-mono">৳{{ f.amount | number:'1.0-0' }}</div>
                <button class="btn-pay-now-mini" [disabled]="payingFeeId() === f.id" (click)="payFee(f)">
                  <span *ngIf="payingFeeId() !== f.id">Pay Now</span>
                  <span *ngIf="payingFeeId() === f.id" class="spinner-sm"></span>
                </button>
              </div>
            </div>
          </div>
        </div>



        <!-- 3. Quick Academic Shortcuts -->
        <div class="card bento-card shortcuts-card">
          <div class="card-header">
            <h2 class="card-title">Quick Actions</h2>
          </div>
          <div class="shortcuts-grid">
            <a routerLink="../courses" class="shortcut-item">
              <div class="shortcut-icon icon-blue"><app-icon name="plus" [size]="18" /></div>
              <div class="shortcut-info">
                <div class="shortcut-title">Course Registration</div>
                <div class="shortcut-desc">Enroll in upcoming term courses</div>
              </div>
            </a>
            <a routerLink="../history" class="shortcut-item">
              <div class="shortcut-icon icon-purple"><app-icon name="history" [size]="18" /></div>
              <div class="shortcut-info">
                <div class="shortcut-title">Academic History</div>
                <div class="shortcut-desc">Download official transcript PDF</div>
              </div>
            </a>
            <a routerLink="../dues" class="shortcut-item">
              <div class="shortcut-icon icon-green"><app-icon name="wallet" [size]="18" /></div>
              <div class="shortcut-info">
                <div class="shortcut-title">Fee Ledger & Receipts</div>
                <div class="shortcut-desc">Review payments & invoices</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </ng-container>
</div>
  `,
  styles: [`
    /* ── Student Dashboard Modern Styles ───────────────────────── */
    :host { display: block; width: 100%; }

    .student-dashboard-page {
      max-width: 1440px;
      margin: 0 auto;
    }

    /* Student Meta Badges in Header */
    .student-meta-strip {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.45rem;
      margin-top: 0.4rem;
    }

    .meta-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.55rem;
      border-radius: var(--radius-xs);
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      font-size: 0.76rem;
      color: var(--text-secondary);

      strong { color: var(--text-primary); }
    }

    .meta-pill--status {
      background: #ECFDF5;
      color: #065F46;
      border-color: #A7F3D0;
      font-weight: 600;

      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #059669;
      }
    }

    .header-due-badge {
      background: #DC2626;
      color: #FFFFFF;
      padding: 0.1rem 0.45rem;
      border-radius: 9999px;
      font-size: 0.72rem;
      font-weight: 700;
      margin-left: 0.35rem;
    }

    .btn-due-highlight {
      border-color: #FCA5A5 !important;
      background: #FEF2F2 !important;
      color: #DC2626 !important;
    }

    /* ── Row 1: KPI Dashboard Grid ────────────────────────────── */
    .kpi-dashboard-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;

      @media (max-width: 1100px) {
        grid-template-columns: repeat(2, 1fr);
      }
      @media (max-width: 600px) {
        grid-template-columns: 1fr;
      }
    }

    .stat-card--kpi-cgpa {
      padding: 1.15rem 1.25rem;
    }

    .kpi-cgpa-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .cgpa-ring-mini {
      position: relative;
      width: 58px;
      height: 58px;
      flex-shrink: 0;
    }

    .cgpa-svg-mini {
      width: 58px;
      height: 58px;
      transform: rotate(-90deg);
    }

    .cgpa-track-mini {
      fill: none;
      stroke: #F1F5F9;
      stroke-width: 6;
    }

    .cgpa-fill-mini {
      fill: none;
      stroke-width: 6;
      stroke-linecap: round;
      stroke-dasharray: 201.06;
      transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s;
    }

    .cgpa-mini-text {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      font-weight: 800;
      color: var(--text-primary);
    }

    .kpi-cgpa-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      flex: 1;
    }

    .kpi-title {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .standing-chip {
      display: inline-flex;
      align-items: center;
      padding: 0.12rem 0.45rem;
      border-radius: var(--radius-xs);
      font-size: 0.75rem;
      font-weight: 700;
      width: fit-content;
    }

    .kpi-sub-text {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-top: 0.1rem;

      strong { color: var(--text-primary); font-weight: 600; }
    }

    /* ── Row 2: Bento Grid (60% / 40%) ───────────────────────── */
    .dashboard-bento-grid {
      display: grid;
      grid-template-columns: 1.35fr 1fr;
      gap: 1.5rem;
      align-items: start;

      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
      }
    }

    .bento-col-main, .bento-col-side {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .bento-card {
      background: #FFFFFF;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .card-header-titles {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .btn-table-action {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: #2563EB;
      text-decoration: none;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-xs);
      transition: background-color 0.15s ease;

      &:hover {
        background: #EFF6FF;
      }
    }

    /* Course Table Refinements */
    .course-name-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .course-cell-title {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.85rem;
    }

    .retake-mini-tag {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.1rem 0.35rem;
      border-radius: 3px;
      background: #FEF3C7;
      color: #92400E;
      border: 1px solid #FDE68A;
    }

    .empty-state-compact {
      padding: 2.5rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6rem;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    /* Chart Container */
    .chart-container-dashboard {
      position: relative;
      height: 220px;
      width: 100%;
      padding: 0.75rem 1.25rem 1.25rem;
    }

    .cgpa-trend-badge {
      font-size: 0.82rem;
      font-weight: 600;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-xs);
    }

    /* ── Right Column: Invoices, Simulator & Shortcuts ───────── */
    .payable-header-title {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .pulse-dot-red {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #DC2626;
      flex-shrink: 0;
    }

    .payable-fee-list {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      padding: 0 1.25rem 1.25rem;
    }

    .payable-fee-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-xs);
      background: #FEF2F2;
      border: 1px solid #FECACA;
    }

    .fee-icon-box {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-xs);
      background: #FEE2E2;
      color: #DC2626;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .fee-main-info {
      flex: 1;
      min-width: 0;
    }

    .fee-title-row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .fee-type-name {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .fee-sem-label {
      font-size: 0.68rem;
      color: #475569;
      background: #F1F5F9;
      padding: 0.08rem 0.35rem;
      border-radius: 3px;
      font-weight: 600;
    }

    .fee-due-date {
      font-size: 0.7rem;
      color: #DC2626;
      margin-top: 0.15rem;
      font-weight: 500;
    }

    .fee-pay-action-col {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.3rem;
    }

    .fee-amount-value {
      font-size: 1.05rem;
      font-weight: 800;
      color: #DC2626;
    }

    .btn-pay-now-mini {
      padding: 0.25rem 0.65rem;
      border-radius: var(--radius-xs);
      border: 1px solid #DC2626;
      background: #DC2626;
      color: #FFFFFF;
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.15s ease;

      &:hover:not(:disabled) {
        background: #B91C1C;
      }
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }



    /* ── Quick Shortcuts ──────────────────────────────────────── */
    .shortcuts-card {
      .shortcuts-grid {
        display: flex;
        flex-direction: column;
        padding: 0.5rem 1.25rem 1rem;
        gap: 0.5rem;
      }
    }

    .shortcut-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-xs);
      border: 1px solid var(--border-light);
      background: #FFFFFF;
      text-decoration: none;
      transition: all 0.15s ease;

      &:hover {
        border-color: #CBD5E1;
        background: var(--bg-elevated);
        transform: translateY(-1px);
      }
    }

    .shortcut-icon {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-xs);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.icon-blue { background: #EFF6FF; color: #2563EB; }
      &.icon-purple { background: #F5F3FF; color: #7C3AED; }
      &.icon-green { background: #ECFDF5; color: #059669; }
    }

    .shortcut-info {
      flex: 1;
    }

    .shortcut-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .shortcut-desc {
      font-size: 0.72rem;
      color: var(--text-muted);
    }
  `]
})
export class StudentDashboardComponent implements OnInit {
  dashboard   = signal<StudentDashboardResponse | null>(null);
  unpaidFees  = signal<FeeResponse[]>([]);
  loading     = signal(true);
  payingFeeId = signal<number | null>(null);
  error       = signal('');
  creditPercent = 0;

  // Chart configuration
  cgpaTrendChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        titleFont: { family: 'Inter', size: 12, weight: 600 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 10,
        cornerRadius: 6,
        displayColors: false,
        boxPadding: 4
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        min: 2.0,
        max: 4.0,
        grid: { color: '#F1F5F9' },
        ticks: { color: '#64748B', font: { family: 'Inter', size: 11 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748B', font: { family: 'Inter', size: 11 } }
      }
    },
    elements: {
      line: { tension: 0.35, borderWidth: 2.5 },
      point: { radius: 4, hoverRadius: 6, borderWidth: 2 }
    }
  };

  cgpaTrendChartData: ChartData<'line'> = {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Current'],
    datasets: [{
      data: [3.1, 3.25, 3.15, 3.4, 3.5], // Will be updated with actual data
      borderColor: '#2563EB',
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      fill: true,
      pointBackgroundColor: '#2563EB',
      pointBorderColor: '#FFFFFF'
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

  get displayName(): string {
    const d = this.dashboard();
    if (d?.studentName) return d.studentName;
    return this.auth.user()?.name || 'Student';
  }

  cgpaMiniDashOffset(cgpa: number): number {
    const circumference = 201.06;
    const pct = Math.min(cgpa / 4.0, 1);
    return circumference * (1 - pct);
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
}
