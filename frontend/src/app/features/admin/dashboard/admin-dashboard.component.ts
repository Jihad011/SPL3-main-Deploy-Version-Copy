import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuditService, AuditLog, PaginatedAuditLogs } from '../../../core/services/audit.service';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { SemesterResponse } from '../../../core/models/models';
import { IconComponent, IconName } from '../../../shared/components/icon/icon.component';
import { ToastService } from '../../../core/services/toast.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
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
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IconComponent,
    BaseChartDirective,
    DatePipe,
    SummaryCardStrip,
    GenericButton
  ],
  animations: [listAnimation],
  template: `
<div class="page">
  <!-- Header -->
  <div class="page-header">
    <div class="page-header-left">
      <p class="page-eyebrow">Academic administration hub</p>
      <h1 class="page-title">Welcome back, {{ fullName }}</h1>
      <p class="page-subtitle">Monitor academic operations, faculty rosters, and jump into common administrative workflows.</p>
    </div>
    <div class="header-actions">
      <div class="semester-badge status-summary status-summary--open" *ngIf="activeSemester()">
        <span class="status-dot"></span> Enrollment Open · <strong>{{ activeSemester()!.label }}</strong>
      </div>
      <div class="semester-badge status-summary status-summary--closed" *ngIf="!activeSemester() && stats()">
        <span class="status-dot"></span> Enrollment Closed
      </div>
    </div>
  </div>

  <!-- CenterPoint Summary Card Strip -->
  <div style="margin-bottom: 1.75rem;" *ngIf="stats()">
    <app-summary-card-strip [items]="summaryItems()" displayMode="page" />
  </div>

  <div class="dashboard-columns" *ngIf="stats()">
    <!-- Chart Column -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">System Distribution</div>
          <div class="card-sub">Active academic entity breakdown</div>
        </div>
      </div>
      <div class="chart-container" style="position: relative; height:250px; width:100%; display: flex; justify-content: center; align-items: center; padding: 1rem;">
        <canvas baseChart
          [data]="distributionChartData"
          [options]="chartOptions"
          [type]="'doughnut'">
        </canvas>
      </div>
    </div>

    <!-- Quick Actions Column -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Administrative Actions</div>
          <div class="card-sub">Direct access to core workflows</div>
        </div>
      </div>
      <div class="quick-actions-grid">
        <a routerLink="../students" class="quick-action-card">
          <span class="qa-icon qa-icon--blue"><app-icon name="users" [size]="20" /></span>
          <div>
            <div class="qa-title">Manage Students</div>
            <div class="qa-sub">Dossiers & directories</div>
          </div>
          <span class="qa-arrow"><app-icon name="arrow-right" [size]="15" /></span>
        </a>
        <a routerLink="../courses" class="quick-action-card">
          <span class="qa-icon qa-icon--purple"><app-icon name="book-open" [size]="20" /></span>
          <div>
            <div class="qa-title">Manage Courses</div>
            <div class="qa-sub">Offerings & seats</div>
          </div>
          <span class="qa-arrow"><app-icon name="arrow-right" [size]="15" /></span>
        </a>
        <a routerLink="../fees" class="quick-action-card">
          <span class="qa-icon qa-icon--green"><app-icon name="credit-card" [size]="20" /></span>
          <div>
            <div class="qa-title">Fee Management</div>
            <div class="qa-sub">Ledgers & gap audits</div>
          </div>
          <span class="qa-arrow"><app-icon name="arrow-right" [size]="15" /></span>
        </a>
        <a routerLink="../semesters" class="quick-action-card">
          <span class="qa-icon qa-icon--amber"><app-icon name="calendar" [size]="20" /></span>
          <div>
            <div class="qa-title">Semesters</div>
            <div class="qa-sub">Session windows</div>
          </div>
          <span class="qa-arrow"><app-icon name="arrow-right" [size]="15" /></span>
        </a>
      </div>
    </div>

    <!-- Activity Feed Column -->
    <div class="card activity-feed-card">
      <div class="card-header">
        <div>
          <div class="card-title">Activity Feed</div>
          <div class="card-sub">Live audit trail</div>
        </div>
        <button class="refresh-btn" [class.spinning]="refreshingLogs()" [disabled]="refreshingLogs()" (click)="loadAuditLogs()">
          <app-icon name="clock" [size]="15" />
        </button>
      </div>
      <div class="activity-feed-list">
        <div class="activity-item" *ngFor="let log of auditLogs()">
          <div class="activity-icon" [ngClass]="getLogIconClass(log.actionType)">
             <app-icon [name]="$any(getLogIcon(log.actionType))" [size]="14" />
          </div>
          <div class="activity-content">
            <div class="activity-text"><strong>{{log.userName}}</strong> {{log.details}}</div>
            <div class="activity-time font-mono">{{log.createdAt | date:'MMM d, h:mm a'}}</div>
          </div>
        </div>
        <div class="empty-state" *ngIf="auditLogs().length === 0">
          No recent activity found.
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  styles: [`
    .dashboard-columns {
      display: grid;
      grid-template-columns: minmax(280px, 1.2fr) minmax(280px, 1.2fr) minmax(280px, 1.2fr);
      gap: 1.5rem;
    }
    @media (max-width: 980px) {
      .dashboard-columns { grid-template-columns: 1fr; }
    }
    .status-summary {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
      font-size: 0.85rem;
    }
    .status-summary--open { background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25); }
    .status-summary--closed { background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.25); }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }

    .quick-actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      padding: 1.25rem;
    }
    .quick-action-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem;
      border-radius: 10px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      text-decoration: none;
      transition: all 0.2s;
    }
    .quick-action-card:hover {
      border-color: var(--accent-primary);
      transform: translateY(-2px);
    }
    .qa-icon {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .qa-icon--blue { background: rgba(34, 211, 238, 0.12); color: #22d3ee; }
    .qa-icon--purple { background: rgba(168, 85, 247, 0.12); color: #a855f7; }
    .qa-icon--green { background: rgba(16, 185, 129, 0.12); color: #10b981; }
    .qa-icon--amber { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
    .qa-title { font-size: 0.85rem; font-weight: 700; color: var(--text-primary); }
    .qa-sub { font-size: 0.72rem; color: var(--text-muted); }
    .qa-arrow { margin-left: auto; color: var(--text-muted); }

    .activity-feed-list {
      padding: 0.5rem 1rem 1rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 260px;
      overflow-y: auto;
    }
    .activity-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    .activity-icon {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .activity-content { flex: 1; font-size: 0.8rem; }
    .activity-time { font-size: 0.7rem; color: var(--text-muted); margin-top: 0.15rem; }
    .refresh-btn {
      background: none;
      border: 1px solid var(--border);
      color: var(--text-muted);
      border-radius: 6px;
      padding: 0.25rem 0.5rem;
      cursor: pointer;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<Record<string, number> | null>(null);
  activeSemester = signal<SemesterResponse | null>(null);
  auditLogs = signal<AuditLog[]>([]);
  refreshingLogs = signal(false);

  private api = inject(ApiService);
  private auditService = inject(AuditService);
  private auth = inject(AuthStateService);
  private toast = inject(ToastService);

  get fullName(): string {
    return this.auth.user()?.name || 'Admin';
  }

  summaryItems = computed<SummaryCardItem[]>(() => {
    const s = this.stats();
    if (!s) return [];
    return [
      { key: 'students', label: 'Total Students', value: s['totalStudents'] || 0, tone: 'primary', icon: 'completed' },
      { key: 'teachers', label: 'Total Faculty', value: s['totalTeachers'] || 0, tone: 'success', icon: 'completed' },
      { key: 'courses', label: 'Active Courses', value: s['totalCourses'] || 0, tone: 'neutral', icon: 'info' },
      { key: 'status', label: 'Enrollment Status', value: this.activeSemester() ? 'OPEN' : 'CLOSED', tone: this.activeSemester() ? 'warning' : 'neutral', icon: 'pause' }
    ];
  });

  distributionChartData: ChartData<'doughnut'> = {
    labels: ['Students', 'Faculty', 'Courses'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#22d3ee', '#10b981', '#a855f7'],
      borderWidth: 0
    }]
  };

  chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } } }
    },
    cutout: '70%'
  };

  ngOnInit(): void {
    this.loadStats();
    this.loadActiveSemester();
    this.loadAuditLogs();
  }

  loadStats(): void {
    this.api.getSystemStats().subscribe({
      next: (s: Record<string, number>) => {
        this.stats.set(s);
        this.distributionChartData = {
          ...this.distributionChartData,
          datasets: [{ ...this.distributionChartData.datasets[0], data: [s['totalStudents'] || 0, s['totalTeachers'] || 0, s['totalCourses'] || 0] }]
        };
      },
      error: () => this.toast.error('Failed to load dashboard statistics.')
    });
  }

  loadActiveSemester(): void {
    this.api.getActiveSemesters().subscribe({
      next: (sems) => {
        if (sems.length > 0) this.activeSemester.set(sems[0]);
      }
    });
  }

  loadAuditLogs(): void {
    this.refreshingLogs.set(true);
    this.auditService.getRecentLogs().subscribe({
      next: (logs: PaginatedAuditLogs) => {
        this.auditLogs.set((logs.content || []).slice(0, 8));
        this.refreshingLogs.set(false);
      },
      error: () => this.refreshingLogs.set(false)
    });
  }

  getLogIcon(actionType: string): IconName {
    if (actionType.includes('ENROLL')) return 'book-open';
    if (actionType.includes('GRADE')) return 'edit';
    if (actionType.includes('FEE') || actionType.includes('PAY')) return 'credit-card';
    if (actionType.includes('USER')) return 'user';
    return 'clock';
  }

  getLogIconClass(actionType: string): string {
    if (actionType.includes('ENROLL')) return 'qa-icon--purple';
    if (actionType.includes('GRADE')) return 'qa-icon--blue';
    if (actionType.includes('FEE') || actionType.includes('PAY')) return 'qa-icon--green';
    return 'qa-icon--amber';
  }
}
