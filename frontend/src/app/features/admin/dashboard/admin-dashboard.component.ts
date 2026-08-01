import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuditService, AuditLog } from '../../../core/services/audit.service';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { SemesterResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToastService } from '../../../core/services/toast.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { listAnimation } from '../../../shared/animations';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, BaseChartDirective, DatePipe],
  animations: [listAnimation],
  template: `
<div class="page">
  <!-- Header -->
  <div class="page-header">
    <div class="page-header-left">
      <p class="page-eyebrow">Administration</p>
      <h1 class="page-title text-gradient-flow">Welcome back, {{ firstName }}</h1>
      <p class="page-subtitle">Monitor academic operations and jump into common tasks.</p>
    </div>
    <div class="semester-badge status-summary status-summary--open" *ngIf="activeSemester()">
      <span class="status-dot"></span> Enrollment open · <strong>{{ activeSemester()!.label }}</strong>
    </div>
    <div class="semester-badge status-summary status-summary--closed" *ngIf="!activeSemester() && stats()">
      <span class="status-dot"></span> Enrollment closed
    </div>
  </div>

  <!-- Skeleton Loaders -->
  <div class="stats-grid" *ngIf="!stats()">
    <div class="stat-skeleton" *ngFor="let i of [1,2,3,4]"></div>
  </div>

  <!-- Stats Grid -->
  <div class="stats-grid" *ngIf="stats()">
    <div class="stat-card stat-card--blue">
      <div class="stat-card-inner">
        <div class="stat-icon"><app-icon name="users" [size]="22" /></div>
        <div class="stat-content">
          <div class="stat-value counter">{{ animatedStudents }}</div>
          <div class="stat-label">Total Students</div>
          <div class="stat-trend stat-trend--up">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            Active accounts
          </div>
        </div>
      </div>
      <a routerLink="../students" class="stat-link">Manage students <app-icon name="arrow-right" [size]="14" /></a>
    </div>

    <div class="stat-card stat-card--green">
      <div class="stat-card-inner">
        <div class="stat-icon"><app-icon name="graduation-cap" [size]="22" /></div>
        <div class="stat-content">
          <div class="stat-value">{{ animatedTeachers }}</div>
          <div class="stat-label">Total Teachers</div>
          <div class="stat-trend stat-trend--up">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            Faculty members
          </div>
        </div>
      </div>
      <a routerLink="../teachers" class="stat-link">Manage faculty <app-icon name="arrow-right" [size]="14" /></a>
    </div>

    <div class="stat-card stat-card--purple">
      <div class="stat-card-inner">
        <div class="stat-icon"><app-icon name="book-open" [size]="22" /></div>
        <div class="stat-content">
          <div class="stat-value">{{ animatedCourses }}</div>
          <div class="stat-label">Active Courses</div>
          <div class="stat-trend stat-trend--neutral">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Current semester
          </div>
        </div>
      </div>
      <a routerLink="../courses" class="stat-link">Manage courses <app-icon name="arrow-right" [size]="14" /></a>
    </div>

    <div class="stat-card" [class.stat-card--blue]="!!activeSemester()" [class.stat-card--red]="!activeSemester()">
      <div class="stat-card-inner">
        <div class="stat-icon"><app-icon name="calendar" [size]="22" /></div>
        <div class="stat-content">
          <div class="stat-value enrollment-status" [class.open]="!!activeSemester()">
            {{ activeSemester() ? 'OPEN' : 'CLOSED' }}
          </div>
          <div class="stat-label">Enrollment Status</div>
          <div class="stat-trend" [class.stat-trend--up]="!!activeSemester()" [class.stat-trend--down]="!activeSemester()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ activeSemester() ? 'Registration active' : 'No active semester' }}
          </div>
        </div>
      </div>
      <a routerLink="../semesters" class="stat-link">Manage semesters <app-icon name="arrow-right" [size]="14" /></a>
    </div>
  </div>

  <div class="dashboard-columns" *ngIf="stats()">
    <!-- Chart Column -->
    <div class="card glass-card card-glow-border">
      <div class="card-header card-glow-border">
        <div class="card-title card-glow-border">System Distribution</div>
        <div class="card-sub card-glow-border">Overview of active entities</div>
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
    <div class="card glass-card card-glow-border">
    <div class="card-header card-glow-border">
      <div>
        <div class="card-title card-glow-border">Quick Actions</div>
        <div class="card-sub card-glow-border">Jump to common administrative tasks</div>
      </div>
    </div>
    <div class="quick-actions-grid">
      <a routerLink="../students" class="quick-action-card card-glow-border">
        <span class="qa-icon qa-icon--blue"><app-icon name="users" [size]="23" /></span>
        <div>
          <div class="qa-title">Manage Students</div>
          <div class="qa-sub">Add, search, and view student profiles</div>
        </div>
        <span class="qa-arrow"><app-icon name="arrow-right" [size]="16" /></span>
      </a>
      <a routerLink="../courses" class="quick-action-card card-glow-border">
        <span class="qa-icon qa-icon--purple"><app-icon name="book-open" [size]="23" /></span>
        <div>
          <div class="qa-title">Manage Courses</div>
          <div class="qa-sub">Create and edit course offerings</div>
        </div>
        <span class="qa-arrow"><app-icon name="arrow-right" [size]="16" /></span>
      </a>
      <a routerLink="../fees" class="quick-action-card card-glow-border">
        <span class="qa-icon qa-icon--green"><app-icon name="credit-card" [size]="23" /></span>
        <div>
          <div class="qa-title">Fee Management</div>
          <div class="qa-sub">Track and process student fees</div>
        </div>
        <span class="qa-arrow"><app-icon name="arrow-right" [size]="16" /></span>
      </a>
      <a routerLink="../semesters" class="quick-action-card card-glow-border">
        <span class="qa-icon qa-icon--amber"><app-icon name="calendar" [size]="23" /></span>
        <div>
          <div class="qa-title">Semesters</div>
          <div class="qa-sub">Manage semester enrollment periods</div>
        </div>
        <span class="qa-arrow"><app-icon name="arrow-right" [size]="16" /></span>
      </a>
    </div>
    <!-- Activity Feed Column -->
    <div class="card glass-card activity-feed-card card-glow-border">
      <div class="card-header card-glow-border">
        <div>
          <div class="card-title card-glow-border">Activity Feed</div>
          <div class="card-sub card-glow-border">Live system audit logs</div>
        </div>
        <button class="refresh-btn" [class.spinning]="refreshingLogs()" [disabled]="refreshingLogs()" (click)="loadAuditLogs()">
          <app-icon name="clock" [size]="16" />
        </button>
      </div>
      <div class="activity-feed-list">
        <div class="activity-item" *ngFor="let log of auditLogs()">
          <div class="activity-icon" [ngClass]="getLogIconClass(log.actionType)">
             <app-icon [name]="$any(getLogIcon(log.actionType))" [size]="14" />
          </div>
          <div class="activity-content">
            <div class="activity-text"><strong>{{log.userName}}</strong> {{log.details}}</div>
            <div class="activity-time">{{log.createdAt | date:'MMM d, h:mm a'}}</div>
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
      grid-template-columns: minmax(300px, 1.2fr) minmax(300px, 1fr) minmax(300px, 1.2fr);
      gap: 1.5rem;
      margin-top: 1.5rem;
    }
    @media (max-width: 900px) {
      .dashboard-columns { grid-template-columns: 1fr; }
    }
    .stat-skeleton {
      height: 140px; border-radius: 16px;
      background: linear-gradient(90deg,
        rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite linear;
    }
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .stat-card-inner { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 0.75rem; }
    .stat-content { flex: 1; }
    .enrollment-status { font-size: 1.4rem !important; letter-spacing: 0.08em; }
    .enrollment-status.open { color: var(--accent-green) !important; }
    .stat-trend {
      display: flex; align-items: center; gap: 0.35rem;
      font-size: 0.72rem; margin-top: 0.25rem;
    }
    .stat-trend--up    { color: var(--accent-green); }
    .stat-trend--down  { color: var(--accent-red); }
    .stat-trend--neutral { color: var(--text-muted); }
    .quick-actions-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem; padding: 1.5rem;
    }
    .quick-action-card {
      display: flex; align-items: center; gap: 1rem;
      padding: 1.25rem; border-radius: 14px;
      background: rgba(255,255,255,0.03); border: 1px solid var(--border);
      text-decoration: none; transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
      cursor: pointer; position: relative; overflow: hidden;
    }
    .quick-action-card::before {
      content: ''; position: absolute; inset: 0; opacity: 0;
      background: var(--grad-primary); transition: opacity .3s;
    }
    .quick-action-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.25);
      border-color: var(--border-glow);
    }
    .quick-action-card:hover::before { opacity: 0.04; }
    .qa-icon {
      font-size: 1.4rem; width: 48px; height: 48px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 12px; flex-shrink: 0;
    }
    .qa-icon--blue   { background: rgba(96,165,250,0.12); color: var(--blue); }
    .qa-icon--purple { background: rgba(167,139,250,0.12); color: var(--purple); }
    .qa-icon--green  { background: rgba(52,211,153,0.12); color: var(--accent-green); }
    .qa-icon--amber  { background: rgba(251,191,36,0.12); color: var(--accent-yellow); }
    .qa-title { font-weight: 600; font-size: 0.9rem; color: var(--text-primary); margin-bottom: 0.2rem; }
    .qa-sub   { font-size: 0.775rem; color: var(--text-muted); line-height: 1.4; }
    .qa-arrow { margin-left: auto; color: var(--text-muted); flex-shrink: 0; transition: transform .2s, color .2s; }
    .quick-action-card:hover .qa-arrow { transform: translateX(4px); color: var(--accent-primary); }
    .activity-feed-card { display: flex; flex-direction: column; max-height: 450px; }
    .activity-feed-list { flex: 1; overflow-y: auto; padding: 0 1.5rem 1.5rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .activity-feed-list::-webkit-scrollbar { width: 4px; }
    .activity-feed-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
    .activity-item { display: flex; gap: 1rem; align-items: flex-start; animation: fadeInDown 0.4s ease forwards; }
    .activity-icon {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 0.2rem;
    }
    .icon-create { background: rgba(52,211,153,0.12); color: var(--accent-green); }
    .icon-update { background: rgba(96,165,250,0.12); color: var(--blue); }
    .icon-danger { background: rgba(248,113,113,0.12); color: var(--accent-red); }
    .icon-default{ background: rgba(167,139,250,0.12); color: var(--purple); }
    .activity-content { flex: 1; }
    .activity-text { font-size: 0.85rem; color: var(--text-primary); line-height: 1.4; }
    .activity-time { font-size: 0.7rem; color: var(--text-muted); margin-top: 0.2rem; }
    .refresh-btn {
      background: rgba(255,255,255,0.05); border: none; border-radius: 8px;
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      color: var(--text-muted); cursor: pointer; transition: all 0.2s;
    }
    .refresh-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #fff; }
    .refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .refresh-btn.spinning app-icon { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats          = signal<Record<string, number> | null>(null);
  activeSemester = signal<SemesterResponse | null>(null);
  auditLogs      = signal<AuditLog[]>([]);
  refreshingLogs = signal<boolean>(false);

  animatedStudents = 0;
  animatedTeachers = 0;
  animatedCourses  = 0;

  private auditService = inject(AuditService);
  private toastService = inject(ToastService);
  private auth = inject(AuthStateService);

  get firstName(): string {
    return this.auth.user()?.name?.trim().split(/\s+/)[0] || 'Admin';
  }

  // Masterclass Chart configuration
  chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#ffffff', font: { family: 'Outfit', size: 14, weight: 500 } } },
      tooltip: {
        backgroundColor: 'rgba(5, 8, 17, 0.9)',
        borderColor: 'rgba(0, 240, 255, 0.3)',
        borderWidth: 1,
        titleFont: { family: 'Outfit', size: 15, weight: 600 },
        bodyFont: { family: 'Inter', size: 14 },
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        boxPadding: 6
      }
    },
    cutout: '75%',
    elements: {
      arc: { borderWidth: 0, hoverOffset: 8 }
    }
  };

  distributionChartData: ChartData<'doughnut'> = {
    labels: ['Students', 'Teachers', 'Courses'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#06b6d4', '#a855f7', '#3b82f6'],
      hoverBackgroundColor: ['#22d3ee', '#c084fc', '#60a5fa']
    }]
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadActiveSemester();
    this.loadAuditLogs();
  }

  loadAuditLogs() {
    this.refreshingLogs.set(true);
    this.auditService.getRecentLogs(0, 10).subscribe({
      next: (res) => {
        this.auditLogs.set(res.content);
        this.refreshingLogs.set(false);
      },
      error: (err) => {
        console.error('Failed to load audit logs', err);
        this.toastService.error('Failed to refresh activity feed.');
        this.refreshingLogs.set(false);
      }
    });
  }

  getLogIconClass(actionType: string): string {
    if (actionType.includes('CREATED')) return 'icon-create';
    if (actionType.includes('DEACTIVATED') || actionType.includes('DELETED')) return 'icon-danger';
    if (actionType.includes('UPDATED') || actionType.includes('PAID')) return 'icon-update';
    return 'icon-default';
  }

  getLogIcon(actionType: string): any {
    if (actionType.includes('USER')) return 'user';
    if (actionType.includes('COURSE')) return 'book-open';
    if (actionType.includes('FEE')) return 'credit-card';
    if (actionType.includes('GRADE')) return 'star';
    return 'clock';
  }

  private loadActiveSemester() {
    this.api.getActiveSemesters().subscribe(sems => {
      if (sems && sems.length > 0) {
        this.activeSemester.set(sems[0]);
      }
    });
  }

  private loadStats() {
    this.api.getSystemStats().subscribe(s => {
      this.stats.set(s);
      
      const st = s['totalStudents'] ?? 0;
      const t = s['totalTeachers'] ?? 0;
      const c = s['totalCourses'] ?? 0;
      
      this.countUp('animatedStudents', st, 1200);
      this.countUp('animatedTeachers', t, 900);
      this.countUp('animatedCourses',  c, 1050);

      this.distributionChartData = {
        labels: ['Students', 'Teachers', 'Courses'],
        datasets: [{
          data: [st, t, c],
          backgroundColor: ['#06b6d4', '#a855f7', '#3b82f6'],
          hoverBackgroundColor: ['#22d3ee', '#c084fc', '#60a5fa']
        }]
      };
    });
    this.api.getActiveSemesters().subscribe({
      next: (s) => this.activeSemester.set(s.length > 0 ? s[0] : null),
      error: ()  => this.activeSemester.set(null)
    });
  }

  private countUp(field: keyof this, target: number, duration: number): void {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      (this as any)[field] = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
