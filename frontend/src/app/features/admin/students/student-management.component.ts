import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UserResponse, EnrollmentResponse, FeeResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToolbarComponent, SortOption, FilterOption } from '../../../shared/components/toolbar/toolbar.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-student-management',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ToolbarComponent],
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
              <button class="icon-btn-sm" (click)="$event.stopPropagation(); openDrawer(s)" title="View profile">
                <app-icon name="eye" [size]="15" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="pagination-controls" *ngIf="totalPages() > 1 && !isSearching">
      <button class="btn btn-secondary" [disabled]="currentPage() === 0" (click)="loadPage(currentPage() - 1)">Previous</button>
      <span>Page {{ currentPage() + 1 }} of {{ totalPages() }}</span>
      <button class="btn btn-secondary" [disabled]="currentPage() >= totalPages() - 1" (click)="loadPage(currentPage() + 1)">Next</button>
    </div>
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
            <span class="code-badge" *ngIf="drawerStudent()?.rollNumber">{{ drawerStudent()?.rollNumber }}</span>
            <span class="batch-tag" *ngIf="drawerStudent()?.batch">{{ drawerStudent()?.batch }}</span>
            <span class="status-badge" [class.status-active]="drawerStudent()?.isActive" [class.status-inactive]="!drawerStudent()?.isActive">
              {{ drawerStudent()?.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>
        <button class="drawer-close-btn" (click)="closeDrawer()">
          <app-icon name="x" [size]="18" />
        </button>
      </div>

      <div class="drawer-body">
        <!-- Contact Info -->
        <div class="drawer-section">
          <div class="drawer-section-title">Contact Information</div>
          <div class="info-row"><span class="info-label">Email</span><span>{{ drawerStudent()?.email }}</span></div>
          <div class="info-row" *ngIf="drawerStudent()?.phone"><span class="info-label">Phone</span><span>{{ drawerStudent()?.phone }}</span></div>
          <div class="info-row" *ngIf="drawerStudent()?.registrationNumber"><span class="info-label">Reg. No.</span><span>{{ drawerStudent()?.registrationNumber }}</span></div>
          <div class="info-row" *ngIf="drawerStudent()?.department"><span class="info-label">Department</span><span>{{ drawerStudent()?.department }}</span></div>
        </div>

        <!-- Fee Summary -->
        <div class="drawer-section" *ngIf="!drawerLoading()">
          <div class="drawer-section-title">Fee Summary</div>
          <div class="fee-summary-chips">
            <div class="fee-chip fee-chip--unpaid">
              <strong>{{ drawerUnpaidFees() }}</strong> Unpaid
            </div>
            <div class="fee-chip fee-chip--paid">
              <strong>{{ drawerPaidFees() }}</strong> Paid
            </div>
          </div>
        </div>

        <!-- Enrollments -->
        <div class="drawer-section" *ngIf="!drawerLoading()">
          <div class="drawer-section-title">Recent Enrollments ({{ drawerEnrollments().length }})</div>
          <div class="drawer-enrollment-list">
            <div class="drawer-enrollment-item" *ngFor="let e of drawerEnrollments().slice(0, 5)">
              <span class="code-badge">{{ e.courseCode }}</span>
              <span class="enrollment-name">{{ e.courseName }}</span>
              <span class="status-badge" [class]="'status-' + e.status.toLowerCase()">{{ e.status }}</span>
            </div>
            <div class="text-muted" *ngIf="drawerEnrollments().length === 0">No enrollments found.</div>
          </div>
        </div>

        <div class="drawer-section" *ngIf="drawerLoading()">
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
            <input type="password" [(ngModel)]="form.password" name="password" required minlength="8" placeholder="At least 8 characters" autocomplete="new-password" />
          </div>
          <div class="form-group">
            <label class="form-label">Roll Number *</label>
            <input type="text" [(ngModel)]="form.rollNumber" name="rollNumber" required placeholder="e.g. BS1413" />
          </div>
          <div class="form-group">
            <label class="form-label">Batch Year *</label>
            <input type="number" [(ngModel)]="form.batch" name="batch" required placeholder="e.g. 2024" />
          </div>
          <div class="form-group">
            <label class="form-label">Registration Number</label>
            <input type="text" [(ngModel)]="form.registrationNumber" name="registrationNumber" placeholder="e.g. REG-2024-001" />
          </div>
          <div class="form-group form-grid-wide">
            <label class="form-label">Phone Number</label>
            <input type="text" [(ngModel)]="form.phone" name="phone" placeholder="e.g. +8801700000000" />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary btn-neon" [disabled]="submitting() || !studentForm.valid">
            {{ submitting() ? 'Registering...' : 'Register Student' }}
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
    .clickable-row:hover td { background: rgba(34,211,238,0.03); }
    .icon-btn-sm {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border: 1px solid var(--border);
      border-radius: 7px; background: var(--bg-card); color: var(--text-muted);
      cursor: pointer; transition: all .2s;
    }
    .icon-btn-sm:hover { border-color: var(--border-glow); color: var(--accent-primary); background: rgba(34,211,238,0.06); }

    /* Grid */
    .student-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.25rem;
    }
    .student-card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 16px; overflow: hidden; cursor: pointer;
      transition: all .25s cubic-bezier(0.4,0,0.2,1);
      display: flex; flex-direction: column;
    }
    .student-card:hover {
      transform: translateY(-4px); border-color: var(--border-glow);
      box-shadow: 0 16px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(34,211,238,0.1);
    }
    .student-card-header {
      padding: 1.5rem 1.5rem 0.75rem;
      display: flex; align-items: flex-start; justify-content: space-between;
    }
    .student-avatar-lg {
      width: 56px; height: 56px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1.4rem; color: #fff;
      flex-shrink: 0;
    }
    .student-card-body { padding: 0 1.5rem 1rem; flex: 1; }
    .student-card-name { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem; }
    .student-card-meta { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
    .student-card-email { font-size: 0.775rem; color: var(--text-muted); }
    .batch-tag {
      background: rgba(167,139,250,0.12); color: var(--purple);
      border-radius: 6px; padding: 0.15rem 0.5rem; font-size: 0.72rem; font-weight: 600;
    }
    .student-card-footer {
      padding: 0.75rem 1.5rem; border-top: 1px solid var(--border);
    }
    .card-action-btn {
      display: flex; align-items: center; gap: 0.4rem;
      background: none; border: none; color: var(--text-muted); font-size: 0.82rem;
      cursor: pointer; padding: 0; transition: color .2s; font-family: inherit;
    }
    .card-action-btn:hover { color: var(--accent-primary); }

    /* Drawer */
    .drawer-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px); z-index: 500;
      animation: fadeIn .2s ease;
    }
    .drawer-panel {
      position: fixed; top: 0; right: 0; bottom: 0; width: 420px;
      max-width: 100vw; background: var(--bg-elevated);
      border-left: 1px solid var(--border); overflow-y: auto;
      animation: slideInRight .3s cubic-bezier(0.4,0,0.2,1);
      display: flex; flex-direction: column;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }
    .drawer-header {
      display: flex; align-items: flex-start; gap: 1rem;
      padding: 1.5rem; border-bottom: 1px solid var(--border);
      background: var(--bg-glass); backdrop-filter: blur(16px);
      position: sticky; top: 0; z-index: 10;
    }
    .drawer-avatar {
      width: 52px; height: 52px; border-radius: 14px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1.4rem; color: #fff; flex-shrink: 0;
    }
    .drawer-student-info { flex: 1; }
    .drawer-name { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem; }
    .drawer-meta-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .drawer-close-btn {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 10px; width: 36px; height: 36px;
      display: flex; align-items: center; justify-content: center;
      color: var(--text-muted); cursor: pointer; transition: all .2s; flex-shrink: 0;
    }
    .drawer-close-btn:hover { color: var(--text-primary); border-color: var(--border-glow); }
    .drawer-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .drawer-section {}
    .drawer-section-title {
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 0.875rem;
    }
    .info-row {
      display: flex; gap: 1rem; padding: 0.5rem 0;
      border-bottom: 1px solid var(--border); font-size: 0.875rem;
    }
    .info-label { color: var(--text-muted); min-width: 90px; flex-shrink: 0; }
    .fee-summary-chips { display: flex; gap: 0.75rem; }
    .fee-chip {
      flex: 1; padding: 0.875rem; border-radius: 12px;
      text-align: center; font-size: 0.82rem;
    }
    .fee-chip strong { display: block; font-size: 1.4rem; font-weight: 700; margin-bottom: 0.2rem; }
    .fee-chip--unpaid { background: rgba(248,113,113,0.1); color: var(--accent-red); border: 1px solid rgba(248,113,113,0.2); }
    .fee-chip--paid   { background: rgba(52,211,153,0.1); color: var(--accent-green); border: 1px solid rgba(52,211,153,0.2); }
    .drawer-enrollment-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .drawer-enrollment-item {
      display: flex; align-items: center; gap: 0.625rem;
      padding: 0.625rem; border-radius: 10px; background: var(--bg-card);
      font-size: 0.85rem;
    }
    .enrollment-name { flex: 1; color: var(--text-secondary); }
    .drawer-skeleton {
      height: 52px; border-radius: 10px; margin-bottom: 0.5rem;
      background: linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%);
      background-size: 200% 100%; animation: shimmer 1.5s infinite linear;
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
  currentPage  = signal(0);
  totalPages   = signal(0);
  pageSize     = 20;
  isSearching  = false;
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
    this.api.getAllStudents(page, this.pageSize).subscribe({
      next: (res) => {
        this.all.set(res.content);
        this.displayed.set(res.content);
        this.currentPage.set(res.number);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
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
