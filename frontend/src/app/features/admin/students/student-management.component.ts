import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UserResponse, EnrollmentResponse, FeeResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToolbarComponent, SortOption, FilterOption } from '../../../shared/components/toolbar/toolbar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-student-management',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ToolbarComponent, PaginationComponent],
  template: `
<div class="page">
  <!-- Page Header -->
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-eyebrow">Directory administration</div>
      <h1 class="page-title">Student Management</h1>
      <p class="page-subtitle">View, search, and add student accounts</p>
    </div>
    <div class="header-actions">
      <button class="btn btn-secondary" (click)="exportDirectoryCsv()" title="Export all students to CSV spreadsheet">
        <app-icon name="download" [size]="15"></app-icon> Export Directory (CSV)
      </button>
      <button class="btn btn-primary" (click)="openAddModal()">
        <app-icon name="user" [size]="15"></app-icon> Add Student
      </button>
    </div>
  </div>

  <!-- Toolbar -->
  <app-toolbar
    searchPlaceholder="Search by name, roll, or registration…"
    [showViewToggle]="true"
    [sortOptions]="sortOptions"
    [filterOptions]="batchFilterOptions()"
    [resultCount]="displayed().length"
    [defaultView]="'list'"
    (searchChange)="onSearch($event)"
    (viewChange)="view.set($event)"
    (sortChange)="onSort($event)"
    (filterChange)="onBatchFilterChange($event)"
  />

  <div class="spinner-wrapper" *ngIf="loading()"><div class="spinner"></div></div>

  <!-- ── Grid View ─────────────────────────────────────── -->
  <div class="student-grid" *ngIf="!loading() && view() === 'grid'">
    <div class="student-card card-glow-border" *ngFor="let s of displayed()" (click)="openDrawer(s)">
      <div class="student-card-header">
        <div class="student-avatar-lg" [style.background]="avatarGradient(s.name)">
          {{ s.name.charAt(0).toUpperCase() }}
        </div>
        <div class="student-card-status">
          <span class="status-badge" [class.status-active]="s.isActive" [class.status-inactive]="!s.isActive">
            {{ s.isActive ? 'Active' : 'Inactive' }}
          </span>
        </div>
      </div>
      <div class="student-card-body">
        <h3 class="student-card-name">{{ s.name }}</h3>
        <div class="student-card-meta">
          <span class="code-badge" *ngIf="s.rollNumber">{{ s.rollNumber }}</span>
          <span class="batch-tag" *ngIf="s.batch">{{ s.batch }}</span>
        </div>
        <div class="student-card-email">{{ s.email }}</div>
      </div>
      <div class="student-card-footer">
        <button class="card-action-btn card-glow-border" (click)="$event.stopPropagation(); openDrawer(s)">
          <app-icon name="eye" [size]="14" /> View Profile
        </button>
      </div>
    </div>
    <div class="empty-state" *ngIf="displayed().length === 0 && !loading()">
      <div class="empty-icon"><app-icon name="users" [size]="28"></app-icon></div>
      <h3>No students found</h3>
      <p>Try a different search term or add a new student.</p>
    </div>
  </div>

  <!-- ── List View ─────────────────────────────────────── -->
  <div class="card card-glow-border" *ngIf="!loading() && view() === 'list'">
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th class="sortable-th" (click)="onSort('rollNumber')">Roll No.</th>
            <th class="sortable-th" (click)="onSort('name')">Name</th>
            <th>Email</th>
            <th class="sortable-th" (click)="onSort('batch')">Batch</th>
            <th>Reg. No.</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let s of displayed()" class="clickable-row table-row-glow" (click)="openDrawer(s)">
            <td><span class="code-badge">{{ s.rollNumber }}</span></td>
            <td>
              <div class="student-cell">
                <div class="student-mini-avatar" [style.background]="avatarGradient(s.name)">{{ s.name[0].toUpperCase() }}</div>
                <strong>{{ s.name }}</strong>
              </div>
            </td>
            <td class="table-date">{{ s.email }}</td>
            <td>{{ s.batch ?? '—' }}</td>
            <td>{{ s.registrationNumber ?? '—' }}</td>
            <td>{{ s.phone ?? '—' }}</td>
            <td>
              <span class="status-badge" [class.status-active]="s.isActive" [class.status-inactive]="!s.isActive">
                {{ s.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <button class="btn-action-view" (click)="$event.stopPropagation(); openDrawer(s)" title="View student dossier & details">
                <app-icon name="eye" [size]="14" />
                <span>View Profile</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <app-pagination
      *ngIf="!isSearching && totalElements() > 0"
      [currentPage]="currentPage()"
      [pageSize]="pageSize()"
      [totalPages]="totalPages()"
      [totalElements]="totalElements()"
      [pageSizeOptions]="pageSizeOptions"
      [disabled]="loading()"
      (pageChange)="loadPage($event)"
      (pageSizeChange)="onPageSizeChange($event)"
    />
    <div class="empty-state" *ngIf="displayed().length === 0 && !loading()">
      <div class="empty-icon"><app-icon name="users" [size]="28"></app-icon></div>
      <h3>No students found</h3>
      <p>Try a different search term or add a new student.</p>
    </div>
  </div>

  <!-- ── Slide-Over Drawer ──────────────────────────────── -->
  <div class="drawer-overlay" *ngIf="drawerOpen()" (click)="closeDrawer()">
    <div class="drawer-panel" (click)="$event.stopPropagation()">
      <div class="drawer-header">
        <div class="drawer-avatar" [style.background]="drawerStudent() ? avatarGradient(drawerStudent()!.name) : ''">
          {{ drawerStudent()?.name?.charAt(0)?.toUpperCase() }}
        </div>
        <div class="drawer-student-info">
          <h2 class="drawer-name">{{ drawerStudent()?.name }}</h2>
          <div class="drawer-meta-row">
            <span class="code-badge" *ngIf="drawerStudent()?.rollNumber">Roll {{ drawerStudent()?.rollNumber }}</span>
            <span class="batch-tag" *ngIf="drawerStudent()?.batch">Batch {{ drawerStudent()?.batch }}</span>
            <span class="status-badge" [class.status-active]="drawerStudent()?.isActive" [class.status-inactive]="!drawerStudent()?.isActive">
              <span class="badge-dot" *ngIf="drawerStudent()?.isActive"></span>
              {{ drawerStudent()?.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>
        <button class="drawer-close-btn" (click)="closeDrawer()" title="Close drawer" aria-label="Close drawer">
          <app-icon name="x" [size]="18" />
        </button>
      </div>

      <div class="drawer-body">
        <!-- Contact & Academic Info Card -->
        <div class="drawer-card">
          <div class="drawer-card-header">
            <div class="drawer-card-icon">
              <app-icon name="user" [size]="15" />
            </div>
            <span>Identity & Contact</span>
          </div>
          <div class="drawer-card-content">
            <div class="drawer-row">
              <span class="drawer-row-label">Email Address</span>
              <span class="drawer-row-val">{{ drawerStudent()?.email }}</span>
            </div>
            <div class="drawer-row" *ngIf="drawerStudent()?.phone">
              <span class="drawer-row-label">Phone</span>
              <span class="drawer-row-val">{{ drawerStudent()?.phone }}</span>
            </div>
            <div class="drawer-row" *ngIf="drawerStudent()?.registrationNumber">
              <span class="drawer-row-label">Registration No.</span>
              <span class="drawer-row-val font-mono">{{ drawerStudent()?.registrationNumber }}</span>
            </div>
            <div class="drawer-row" *ngIf="drawerStudent()?.department">
              <span class="drawer-row-label">Department</span>
              <span class="drawer-row-val">{{ drawerStudent()?.department }}</span>
            </div>
          </div>
        </div>

        <!-- Fee Summary Card -->
        <div class="drawer-card" *ngIf="!drawerLoading()">
          <div class="drawer-card-header">
            <div class="drawer-card-icon">
              <app-icon name="credit-card" [size]="15" />
            </div>
            <span>Financial Accounts</span>
          </div>
          <div class="drawer-card-content">
            <div class="fee-summary-chips">
              <div class="fee-chip fee-chip--unpaid">
                <div class="fee-chip-val">{{ drawerUnpaidFees() }}</div>
                <div class="fee-chip-label">Unpaid Dues</div>
              </div>
              <div class="fee-chip fee-chip--paid">
                <div class="fee-chip-val">{{ drawerPaidFees() }}</div>
                <div class="fee-chip-label">Paid Invoices</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Enrollments Card -->
        <div class="drawer-card" *ngIf="!drawerLoading()">
          <div class="drawer-card-header">
            <div class="drawer-card-icon">
              <app-icon name="book-open" [size]="15" />
            </div>
            <span>Course Enrollments ({{ drawerEnrollments().length }})</span>
          </div>
          <div class="drawer-card-content">
            <div class="drawer-enrollment-list">
              <div class="drawer-enrollment-item" *ngFor="let e of drawerEnrollments().slice(0, 5)">
                <span class="code-badge">{{ e.courseCode }}</span>
                <span class="enrollment-name">{{ e.courseName }}</span>
                <span class="status-badge" [class]="'status-' + e.status.toLowerCase()">{{ e.status }}</span>
              </div>
              <div class="drawer-empty-hint" *ngIf="drawerEnrollments().length === 0">
                No active course enrollments registered.
              </div>
            </div>
          </div>
        </div>

        <!-- Loading Skeleton -->
        <div class="drawer-card" *ngIf="drawerLoading()">
          <div class="drawer-skeleton" *ngFor="let i of [1,2,3]"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Add Student Modal -->
  <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
    <div class="modal-card" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h2>Register New Student</h2>
        <button class="btn-close" (click)="closeModal()" aria-label="Close dialog">
          <app-icon name="x" [size]="17"></app-icon>
        </button>
      </div>
      <div class="alert alert-error" *ngIf="errorMessage()">
        <app-icon name="alert-triangle" [size]="18"></app-icon>{{ errorMessage() }}
      </div>
      <form (ngSubmit)="submitStudent()" #studentForm="ngForm" autocomplete="off">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" [(ngModel)]="form.name" name="name" required placeholder="e.g. Md. Jihad Hossain" autocomplete="off" />
          </div>
          <div class="form-group">
            <label class="form-label">Email Address *</label>
            <input type="email" [(ngModel)]="form.email" name="email" required placeholder="e.g. student@du.ac.bd" autocomplete="off" />
          </div>
          <div class="form-group">
            <label class="form-label">Password *</label>
            <input type="password" [(ngModel)]="form.password" name="password" required placeholder="••••••••" autocomplete="new-password" />
          </div>
          <div class="form-group">
            <label class="form-label">Class Roll Number *</label>
            <input type="text" [(ngModel)]="form.rollNumber" name="rollNumber" required placeholder="e.g. 1413" />
          </div>
          <div class="form-group">
            <label class="form-label">Batch (e.g. 14, 15) *</label>
            <input type="number" [(ngModel)]="form.batch" name="batch" required placeholder="e.g. 14" />
          </div>
          <div class="form-group">
            <label class="form-label">Registration Number</label>
            <input type="text" [(ngModel)]="form.registrationNumber" name="registrationNumber" placeholder="e.g. REG-2021-1413" />
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="text" [(ngModel)]="form.phone" name="phone" placeholder="e.g. 01700000000" />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="closeModal()" [disabled]="submitting()">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="submitting() || !studentForm.form.valid">
            <span *ngIf="!submitting()">Create Student Account</span>
            <span *ngIf="submitting()">Creating Student...</span>
          </button>
        </div>
      </form>
    </div>
  </div>
  `,
  styles: [`
    .sortable-th { cursor: pointer; user-select: none; }
    .sortable-th:hover { color: var(--accent-primary); }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover td { background: var(--bg-card-hover); }

    /* ✨ High-End Action View Button ✨ */
    .btn-action-view {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.42rem 0.85rem;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm, 8px);
      color: var(--text-primary);
      font-family: inherit;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: var(--shadow-sm);
      white-space: nowrap;
    }

    .btn-action-view app-icon {
      color: var(--cyan);
      transition: transform 0.2s ease;
    }

    .btn-action-view:hover {
      background: var(--bg-elevated);
      border-color: var(--cyan);
      color: var(--cyan);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
    }

    .btn-action-view:hover app-icon {
      transform: scale(1.15);
    }

    /* Grid */
    .student-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }
    .student-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg, 16px);
      overflow: hidden;
      cursor: pointer;
      transition: all .25s cubic-bezier(0.4,0,0.2,1);
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-sm);
    }
    .student-card:hover {
      transform: translateY(-3px);
      border-color: var(--border-glow, #CBD5E1);
      box-shadow: var(--shadow-md);
    }
    .student-card-header {
      padding: 1.5rem 1.5rem 0.75rem;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    .student-avatar-lg {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.35rem;
      color: #fff;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .student-card-body { padding: 0 1.5rem 1rem; flex: 1; }
    .student-card-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.4rem;
    }
    .student-card-meta { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
    .student-card-email { font-size: 0.8rem; color: var(--text-muted); }
    .batch-tag {
      background: rgba(167,139,250,0.12);
      color: var(--purple, #7C3AED);
      border: 1px solid rgba(167,139,250,0.25);
      border-radius: 6px;
      padding: 0.15rem 0.5rem;
      font-size: 0.72rem;
      font-weight: 600;
    }
    .student-card-footer {
      padding: 0.85rem 1.5rem;
      border-top: 1px solid var(--border-light);
      background: var(--bg-surface);
    }
    .card-action-btn {
      width: 100%;
      justify-content: center;
    }

    /* ✨ Luxury Slide-Over Dossier Drawer ✨ */
    .drawer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 500;
      animation: fadeIn .2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .drawer-panel {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 480px;
      max-width: 100vw;
      background: var(--bg-card);
      border-left: 1px solid var(--border);
      box-shadow: -12px 0 40px rgba(0, 0, 0, 0.25);
      overflow-y: auto;
      animation: slideInRight .28s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }
    .drawer-header {
      display: flex;
      align-items: center;
      gap: 1.15rem;
      padding: 1.75rem 1.75rem 1.5rem;
      border-bottom: 1px solid var(--border);
      background: var(--bg-surface);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .drawer-avatar {
      width: 58px;
      height: 58px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.5rem;
      color: #fff;
      flex-shrink: 0;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }
    .drawer-student-info { flex: 1; min-width: 0; }
    .drawer-name {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 0.4rem;
      line-height: 1.25;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .drawer-meta-row { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
    .drawer-close-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      cursor: pointer;
      transition: all .2s;
      flex-shrink: 0;
    }
    .drawer-close-btn:hover {
      color: var(--text-primary);
      border-color: var(--cyan);
      background: var(--bg-elevated);
      transform: scale(1.05);
    }

    .drawer-body {
      padding: 1.5rem 1.75rem 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .drawer-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg, 14px);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .drawer-card-header {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.85rem 1.25rem;
      background: var(--bg-elevated);
      border-bottom: 1px solid var(--border-light);
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
    }
    .drawer-card-icon {
      color: var(--cyan);
      display: flex;
      align-items: center;
    }
    .drawer-card-content {
      padding: 1.15rem 1.25rem;
    }

    .drawer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.65rem 0;
      border-bottom: 1px solid var(--border-light);
      font-size: 0.86rem;
    }
    .drawer-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .drawer-row:first-child {
      padding-top: 0;
    }
    .drawer-row-label {
      color: var(--text-muted);
      font-weight: 500;
    }
    .drawer-row-val {
      color: var(--text-primary);
      font-weight: 600;
      text-align: right;
    }

    .fee-summary-chips {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.85rem;
    }
    .fee-chip {
      padding: 1rem 0.85rem;
      border-radius: 12px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .fee-chip-val {
      font-size: 1.55rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }
    .fee-chip-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .fee-chip--unpaid {
      background: rgba(239, 68, 68, 0.08);
      color: #DC2626;
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .fee-chip--paid {
      background: rgba(16, 185, 129, 0.08);
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .drawer-enrollment-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .drawer-enrollment-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      border-radius: 8px;
      background: var(--bg-card);
      border: 1px solid var(--border-light);
      font-size: 0.84rem;
    }
    .enrollment-name {
      flex: 1;
      color: var(--text-primary);
      font-weight: 600;
    }
    .drawer-empty-hint {
      color: var(--text-muted);
      font-size: 0.82rem;
      text-align: center;
      padding: 0.5rem 0;
    }

    .drawer-skeleton {
      height: 48px;
      border-radius: 8px;
      margin-bottom: 0.65rem;
      background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite linear;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    @media (max-width: 640px) {
      .student-grid { grid-template-columns: 1fr; }
      .drawer-panel { width: 100vw; }
    }
  `]
})
export class StudentManagementComponent implements OnInit {
  all          = signal<UserResponse[]>([]);
  displayed    = signal<UserResponse[]>([]);
  loading      = signal(true);
  showModal    = signal(false);
  submitting   = signal(false);
  errorMessage = signal('');
  view         = signal<'grid' | 'list'>('list');
  currentPage   = signal(0);
  totalPages    = signal(0);
  totalElements = signal(0);
  pageSize      = signal(25);
  readonly pageSizeOptions = [25, 50, 75, 100];
  isSearching   = false;
  private currentSort = '';

  // Drawer
  drawerOpen        = signal(false);
  drawerStudent     = signal<UserResponse | null>(null);
  drawerLoading     = signal(false);
  drawerEnrollments = signal<EnrollmentResponse[]>([]);
  drawerFees        = signal<FeeResponse[]>([]);
  drawerUnpaidFees  = computed(() => this.drawerFees().filter(f => f.status === 'UNPAID').length);
  drawerPaidFees    = computed(() => this.drawerFees().filter(f => f.status === 'PAID').length);

  readonly sortOptions: SortOption[] = [
    { label: 'Name (A-Z)',   value: 'name' },
    { label: 'Roll Number',  value: 'rollNumber' },
    { label: 'Batch (Newest)', value: 'batchDesc' },
    { label: 'Batch (Oldest)', value: 'batchAsc' },
  ];

  selectedBatch = signal<string>('ALL');

  batchFilterOptions = computed<FilterOption[]>(() => {
    const batches = Array.from(new Set(this.all().map(s => s.batch).filter((b): b is number => b !== null && b !== undefined))).sort((a, b) => b - a);
    return batches.map(b => ({ label: `Batch ${b}`, value: String(b) }));
  });

  onBatchFilterChange(types: string[]): void {
    if (types.length === 0) {
      this.selectedBatch.set('ALL');
      this.displayed.set(this.all());
    } else {
      const selected = types[0];
      this.selectedBatch.set(selected);
      const batchNum = parseInt(selected, 10);
      this.displayed.set(this.all().filter(s => s.batch === batchNum));
    }
  }

  form = {
    name: '', email: '', password: '', rollNumber: '',
    batch: null as number | null, registrationNumber: '', phone: '', role: 'STUDENT'
  };

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void { this.loadPage(0); }

  loadPage(page: number): void {
    if (page < 0 || (this.totalPages() > 0 && page >= this.totalPages())) return;
    this.loading.set(true);
    this.isSearching = false;
    this.api.getAllStudents(page, this.pageSize()).subscribe({
      next: (res) => {
        this.all.set(res.content);
        this.displayed.set(res.content);
        this.currentPage.set(res.number);
        this.totalPages.set(res.totalPages);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.loadPage(0);
  }

  onSearch(q: string): void {
    if (!q.trim()) { this.isSearching = false; this.loadPage(0); return; }
    this.isSearching = true;
    this.loading.set(true);
    this.api.searchStudents(q).subscribe({
      next: (res) => { this.displayed.set(res); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSort(key: string): void {
    this.currentSort = key;
    const list = [...this.displayed()];
    switch (key) {
      case 'name':      list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'rollNumber': list.sort((a, b) => (a.rollNumber ?? '').localeCompare(b.rollNumber ?? '')); break;
      case 'batchDesc': list.sort((a, b) => (b.batch ?? 0) - (a.batch ?? 0)); break;
      case 'batchAsc':  list.sort((a, b) => (a.batch ?? 0) - (b.batch ?? 0)); break;
    }
    this.displayed.set(list);
  }

  avatarGradient(name: string): string {
    const gradients = [
      'linear-gradient(135deg, #22d3ee, #6366f1)',
      'linear-gradient(135deg, #a78bfa, #f472b6)',
      'linear-gradient(135deg, #34d399, #0ea5e9)',
      'linear-gradient(135deg, #fb923c, #f43f5e)',
      'linear-gradient(135deg, #fbbf24, #10b981)',
    ];
    const idx = name.charCodeAt(0) % gradients.length;
    return gradients[idx];
  }

  openDrawer(s: UserResponse): void {
    this.drawerStudent.set(s);
    this.drawerOpen.set(true);
    this.drawerLoading.set(true);
    this.drawerEnrollments.set([]);
    this.drawerFees.set([]);
    this.api.getStudentFees(s.id).subscribe({
      next: (fees) => { this.drawerFees.set(fees); this.checkDrawerLoaded(); },
      error: () => this.checkDrawerLoaded()
    });
  }

  private checkDrawerLoaded(): void { this.drawerLoading.set(false); }

  closeDrawer(): void { this.drawerOpen.set(false); }

  openAddModal(): void {
    console.log('openAddModal clicked! Setting showModal to true.');
    this.form = { name: '', email: '', password: '', rollNumber: '',
      batch: new Date().getFullYear(), registrationNumber: '', phone: '', role: 'STUDENT' };
    this.errorMessage.set('');
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  submitStudent(): void {
    this.submitting.set(true);
    this.errorMessage.set('');
    this.api.createStudent({ ...this.form, role: 'STUDENT' }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeModal();
        this.loadPage(this.currentPage());
        this.toast.success('Student registered successfully!');
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err.error?.detail || err.error?.message || 'Failed to create student';
        this.errorMessage.set(msg);
        this.toast.error(msg);
      }
    });
  }

  exportDirectoryCsv(): void {
    const list = this.displayed();
    if (!list.length) {
      this.toast.info('No student records to export.');
      return;
    }
    const headers = ['#', 'Roll Number', 'Student Name', 'Email', 'Batch', 'Registration Number', 'Phone', 'Status'];
    const lines = list.map((s, i) => [
      i + 1,
      s.rollNumber ?? '',
      `"${s.name}"`,
      s.email ?? '',
      s.batch ?? '',
      s.registrationNumber ?? '',
      s.phone ?? '',
      s.isActive ? 'Active' : 'Inactive'
    ].join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Student_Directory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.toast.success(`Exported ${list.length} student records to CSV! 📊`);
  }
}
