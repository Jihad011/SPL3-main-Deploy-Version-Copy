import { Component, OnInit, signal, computed, inject, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { FeeResponse, UserResponse, SemesterResponse, FeeCreateRequest } from '../../../core/models/models';
import { IconComponent, IconName } from '../../../shared/components/icon/icon.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { PdfService } from '../../../core/services/pdf.service';
import { ToastService } from '../../../core/services/toast.service';

const FEE_TYPE_ICONS: Record<string, IconName> = {
  RETAKE: 'list-check',
  SEMESTER_GAP: 'calendar',
  REGISTRATION: 'credit-card',
  OTHER: 'credit-card'
};

@Component({
  selector: 'app-fee-management',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe, IconComponent, ConfirmModalComponent],
  template: `
<div class="page">
  <!-- Page Header -->
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-eyebrow">Financial administration</div>
      <h1 class="page-title">Fee Management</h1>
      <p class="page-subtitle">Track, issue, and audit all student fee records and semester gap penalties</p>
    </div>
    <div class="header-actions">
      <button class="btn btn-secondary" [disabled]="auditingGapFines()" (click)="auditSemesterGapFines()" title="Audit all student cohorts and auto-assess 10,000 BDT fines for skipped semesters">
        <app-icon name="calendar" [size]="15"></app-icon>
        <span *ngIf="!auditingGapFines()">Audit Gap Fines</span>
        <span *ngIf="auditingGapFines()" class="spinner-sm"></span>
      </button>
      <button class="btn btn-primary" (click)="openCreateModal()">
        <app-icon name="plus" [size]="15"></app-icon> Issue New Fee
      </button>
    </div>
  </div>

  <div class="spinner-wrapper" *ngIf="loading()"><div class="spinner"></div></div>

  <app-confirm-modal #confirmModal (confirm)="confirmMarkAsPaid()" />

  <ng-container *ngIf="!loading()">
    <!-- ── Stats Overview ──────────────────────────────────── -->
    <div class="stats-grid">
      <div class="stat-card stat-card--blue">
        <div class="stat-card-inner">
          <div class="stat-icon"><app-icon name="wallet" [size]="22"></app-icon></div>
          <div class="stat-content">
            <div class="stat-value">৳{{ totalInvoiced() | number:'1.0-0' }}</div>
            <div class="stat-label">Total Invoiced</div>
            <div class="stat-sub">{{ fees().length }} total invoice(s)</div>
          </div>
        </div>
      </div>

      <div class="stat-card stat-card--green">
        <div class="stat-card-inner">
          <div class="stat-icon"><app-icon name="check-circle" [size]="22"></app-icon></div>
          <div class="stat-content">
            <div class="stat-value">৳{{ totalCollected() | number:'1.0-0' }}</div>
            <div class="stat-label">Total Collected</div>
            <div class="stat-sub">{{ paidCount() }} paid invoice(s)</div>
          </div>
        </div>
      </div>

      <div class="stat-card stat-card--red">
        <div class="stat-card-inner">
          <div class="stat-icon"><app-icon name="alert-triangle" [size]="22"></app-icon></div>
          <div class="stat-content">
            <div class="stat-value">৳{{ totalOutstanding() | number:'1.0-0' }}</div>
            <div class="stat-label">Outstanding Dues</div>
            <div class="stat-sub">{{ unpaidCount() }} pending payment(s)</div>
          </div>
        </div>
      </div>

      <div class="stat-card stat-card--purple">
        <div class="stat-card-inner">
          <div class="stat-icon"><app-icon name="calendar" [size]="22"></app-icon></div>
          <div class="stat-content">
            <div class="stat-value">৳{{ totalGapFines() | number:'1.0-0' }}</div>
            <div class="stat-label">Gap Penalties</div>
            <div class="stat-sub">{{ gapFineCount() }} fine(s) assessed</div>
          </div>
        </div>
      </div>

      <div class="stat-card stat-card--blue">
        <div class="stat-card-inner">
          <div class="stat-icon"><app-icon name="star" [size]="22"></app-icon></div>
          <div class="stat-content">
            <div class="stat-value">{{ collectionRate() }}%</div>
            <div class="stat-label">Collection Rate</div>
            <div class="progress-bar" style="margin-top:0.5rem">
              <div class="progress-fill" [style.width.%]="collectionRate()"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Filter & Search Toolbar ────────────────────────── -->
    <div class="toolbar-wrapper">
      <div class="filter-tabs-bar">
        <button class="filter-tab" [class.active]="filter() === 'ALL'" (click)="filter.set('ALL')">
          All Invoices <span class="filter-count">{{ fees().length }}</span>
        </button>
        <button class="filter-tab" [class.active]="filter() === 'UNPAID'" (click)="filter.set('UNPAID')">
          <span class="dot-unpaid"></span> Unpaid <span class="filter-count">{{ unpaidCount() }}</span>
        </button>
        <button class="filter-tab" [class.active]="filter() === 'PAID'" (click)="filter.set('PAID')">
          <span class="dot-paid"></span> Paid <span class="filter-count">{{ paidCount() }}</span>
        </button>
      </div>

      <div class="search-box">
        <app-icon name="search" [size]="16" class="search-icon"></app-icon>
        <input
          type="text"
          placeholder="Search by student name, roll number, or fee type..."
          [(ngModel)]="searchQuery"
        />
        <button class="clear-search" *ngIf="searchQuery" (click)="searchQuery = ''">
          <app-icon name="x" [size]="14"></app-icon>
        </button>
      </div>
    </div>

    <!-- ── Invoices Data Table ────────────────────────────── -->
    <div class="card card-glow-border">
      <div class="card-header card-glow-border">
        <div>
          <div class="card-title card-glow-border">Student Invoices</div>
          <div class="card-sub card-glow-border">Showing {{ filteredFees().length }} of {{ fees().length }} total records</div>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Student</th>
              <th>Fee Type</th>
              <th>Semester</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Payment Method</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let f of filteredFees()" class="clickable-row">
              <td><span class="code-badge">#{{ f.id.toString().padStart(5, '0') }}</span></td>
              <td>
                <div class="student-cell">
                  <div class="student-mini-avatar" [style.background]="avatarGradient(f.studentName || 'Student')">
                    {{ (f.studentName || 'S').charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <strong>{{ f.studentName || 'Unknown Student' }}</strong>
                    <div class="text-muted text-xs" *ngIf="f.rollNumber">Roll: {{ f.rollNumber }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="fee-type-chip">
                  <app-icon [name]="feeTypeIcon(f.feeType)" [size]="13"></app-icon>
                  {{ f.feeTypeDisplay || f.feeType }}
                </span>
              </td>
              <td>{{ f.semesterLabel || '—' }}</td>
              <td><strong class="fee-amount">৳{{ f.amount | number:'1.0-0' }}</strong></td>
              <td>
                <span [class.text-danger]="isOverdue(f)">
                  {{ f.dueDate ? (f.dueDate | date:'dd MMM yyyy') : '—' }}
                </span>
              </td>
              <td>
                <span class="status-badge" [class.status-active]="f.status === 'PAID'" [class.status-inactive]="f.status === 'UNPAID'">
                  <span class="badge-dot" *ngIf="f.status === 'UNPAID'"></span>
                  {{ f.status }}
                </span>
              </td>
              <td>
                <span class="pm-tag" *ngIf="f.paymentMethod">{{ f.paymentMethod.replace('_', ' ') }}</span>
                <span class="text-muted" *ngIf="!f.paymentMethod">—</span>
              </td>
              <td>
                <div class="row-actions">
                  <button
                    *ngIf="f.status === 'UNPAID'"
                    class="btn btn-sm btn-primary btn-neon"
                    (click)="openMarkPaidModal(f)"
                    title="Mark invoice as paid"
                  >
                    <app-icon name="check-circle" [size]="14"></app-icon> Mark Paid
                  </button>
                  <button
                    *ngIf="f.status === 'PAID'"
                    class="btn-action-receipt"
                    (click)="downloadReceipt(f)"
                    title="Download Payment Receipt"
                  >
                    <app-icon name="download" [size]="14"></app-icon> Receipt
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="empty-state" *ngIf="filteredFees().length === 0">
        <div class="empty-icon"><app-icon name="credit-card" [size]="28"></app-icon></div>
        <h3>No matching invoices found</h3>
        <p>{{ fees().length === 0 ? 'No fee records have been issued yet.' : 'Try adjusting your search query or filter.' }}</p>
      </div>
    </div>
  </ng-container>
</div>

<!-- ── Issue Fee Modal ────────────────────────────────────── -->
<div class="modal-overlay" *ngIf="showCreateModal()" (click)="closeCreateModal()">
  <div class="modal-card" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <h2>Issue New Student Fee</h2>
      <button class="btn-icon" (click)="closeCreateModal()"><app-icon name="x" [size]="20"></app-icon></button>
    </div>
    <div class="modal-body">
      <div class="alert alert-error" *ngIf="createError()">{{ createError() }}</div>
      
      <div class="form-grid">
        <div class="form-group form-grid-wide">
          <label>Select Student *</label>
          <select [(ngModel)]="newFee.studentId" class="form-control">
            <option [ngValue]="null" disabled>-- Choose Student --</option>
            <option *ngFor="let s of students()" [ngValue]="s.id">
              {{ s.name }} (Roll: {{ s.rollNumber || 'N/A' }} - {{ s.email }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Fee Type *</label>
          <select [(ngModel)]="newFee.feeType" class="form-control">
            <option value="RETAKE">Course Retake Fee</option>
            <option value="SEMESTER_GAP">Semester Gap Penalty</option>
            <option value="REGISTRATION">Registration Fee</option>
            <option value="OTHER">Other Fee</option>
          </select>
        </div>

        <div class="form-group">
          <label>Amount (BDT) *</label>
          <input type="number" [(ngModel)]="newFee.amount" placeholder="e.g. 3000" min="1" class="form-control" />
        </div>

        <div class="form-group">
          <label>Semester (Optional)</label>
          <select [(ngModel)]="newFee.semesterId" class="form-control">
            <option [ngValue]="null">-- None / General --</option>
            <option *ngFor="let sem of semesters()" [ngValue]="sem.id">{{ sem.label }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>Due Date (Optional)</label>
          <input type="date" [(ngModel)]="newFee.dueDate" class="form-control" />
        </div>

        <div class="form-group form-grid-wide">
          <label>Description / Reason</label>
          <input type="text" [(ngModel)]="newFee.description" placeholder="e.g. Penalty for 1-semester gap" class="form-control" />
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" (click)="closeCreateModal()" [disabled]="creating()">Cancel</button>
      <button class="btn btn-primary btn-neon" (click)="submitCreateFee()" [disabled]="creating() || !newFee.studentId || !newFee.amount">
        <span *ngIf="!creating()">Issue Fee Invoice</span>
        <span *ngIf="creating()" class="spinner-sm"></span>
      </button>
    </div>
  </div>
</div>

<!-- ── Mark As Paid Modal ─────────────────────────────────── -->
<div class="modal-overlay" *ngIf="showPaymentModal()" (click)="closePaymentModal()">
  <div class="modal-card" (click)="$event.stopPropagation()" style="max-width: 440px;">
    <div class="modal-header">
      <h2>Record Fee Payment</h2>
      <button class="btn-icon" (click)="closePaymentModal()"><app-icon name="x" [size]="20"></app-icon></button>
    </div>
    <div class="modal-body" *ngIf="selectedFee">
      <div class="payment-confirm-box">
        <div class="fee-confirm-title">{{ selectedFee.feeTypeDisplay || selectedFee.feeType }}</div>
        <div class="fee-confirm-amount">৳{{ selectedFee.amount | number:'1.0-0' }}</div>
        <div class="fee-confirm-student">Student: <strong>{{ selectedFee.studentName }}</strong> (Roll: {{ selectedFee.rollNumber }})</div>
      </div>

      <div class="form-group" style="margin-top: 1.25rem;">
        <label>Payment Method *</label>
        <select [(ngModel)]="selectedPaymentMethod" class="form-control">
          <option value="CASH">Cash Deposit</option>
          <option value="BKASH">bKash</option>
          <option value="NAGAD">Nagad</option>
          <option value="ROCKET">Rocket</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="CREDIT_CARD">Credit / Debit Card</option>
        </select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" (click)="closePaymentModal()" [disabled]="paying()">Cancel</button>
      <button class="btn btn-primary btn-neon" (click)="submitMarkAsPaid()" [disabled]="paying()">
        <span *ngIf="!paying()">Confirm & Mark Paid</span>
        <span *ngIf="paying()" class="spinner-sm"></span>
      </button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .toolbar-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .filter-tabs-bar {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0;
    }
    .filter-tab {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 1rem;
      border: none;
      background: none;
      color: var(--text-muted);
      font-size: 0.875rem;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: all 0.2s;
      font-family: inherit;
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
    .dot-unpaid { width: 8px; height: 8px; border-radius: 50%; background: var(--accent-red); display: inline-block; }
    .dot-paid   { width: 8px; height: 8px; border-radius: 50%; background: var(--accent-green); display: inline-block; }

    .search-box {
      position: relative;
      min-width: 320px;
      flex: 1;
      max-width: 450px;
    }
    .search-box input {
      width: 100%;
      padding: 0.6rem 2.2rem 0.6rem 2.2rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text-primary);
      font-size: 0.85rem;
      font-family: inherit;
    }
    .search-box input:focus {
      outline: none;
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.15);
    }
    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }
    .clear-search {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
    }

    .fee-type-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(167, 139, 250, 0.1);
      color: var(--purple);
      border: 1px solid rgba(167, 139, 250, 0.2);
    }
    .fee-amount {
      font-size: 0.95rem;
      color: var(--text-primary);
      font-family: 'Inter', monospace;
    }
    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent-red);
      margin-right: 0.25rem;
      display: inline-block;
    }
    .pm-tag {
      font-size: 0.75rem;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      background: var(--bg-elevated);
      color: var(--text-secondary);
      border: 1px solid var(--border);
    }
    .text-danger { color: var(--accent-red); font-weight: 600; }
    .text-xs { font-size: 0.72rem; }

    .row-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-action-receipt {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.35rem 0.65rem;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      background: transparent;
      border: 1px solid var(--accent-green);
      color: var(--accent-green);
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-action-receipt:hover {
      background: var(--accent-green);
      color: white;
    }

    .payment-confirm-box {
      text-align: center;
      padding: 1.25rem;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
    }
    .fee-confirm-title { font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .fee-confirm-amount { font-size: 2rem; font-weight: 800; color: var(--accent-green); margin: 0.35rem 0; }
    .fee-confirm-student { font-size: 0.85rem; color: var(--text-secondary); }
  `]
})
export class FeeManagementComponent implements OnInit {
  fees = signal<FeeResponse[]>([]);
  students = signal<UserResponse[]>([]);
  semesters = signal<SemesterResponse[]>([]);
  loading = signal(true);
  creating = signal(false);
  paying = signal(false);
  auditingGapFines = signal(false);
  filter = signal<'ALL' | 'UNPAID' | 'PAID'>('ALL');
  searchQuery = '';

  showCreateModal = signal(false);
  showPaymentModal = signal(false);
  createError = signal('');
  selectedFee: FeeResponse | null = null;
  selectedPaymentMethod = 'CASH';

  newFee = {
    studentId: null as number | null,
    feeType: 'RETAKE' as any,
    amount: 3000,
    semesterId: null as number | null,
    dueDate: '',
    description: ''
  };

  private api = inject(ApiService);
  private toast = inject(ToastService);
  private pdfService = inject(PdfService);

  totalInvoiced = computed(() => this.fees().reduce((sum, f) => sum + (f.amount || 0), 0));
  totalCollected = computed(() => this.fees().filter(f => f.status === 'PAID').reduce((sum, f) => sum + (f.amount || 0), 0));
  totalOutstanding = computed(() => this.fees().filter(f => f.status === 'UNPAID').reduce((sum, f) => sum + (f.amount || 0), 0));
  totalGapFines = computed(() => this.fees().filter(f => f.feeType === 'SEMESTER_GAP').reduce((sum, f) => sum + (f.amount || 0), 0));
  gapFineCount = computed(() => this.fees().filter(f => f.feeType === 'SEMESTER_GAP').length);
  paidCount = computed(() => this.fees().filter(f => f.status === 'PAID').length);
  unpaidCount = computed(() => this.fees().filter(f => f.status === 'UNPAID').length);
  collectionRate = computed(() => {
    const total = this.totalInvoiced();
    return total > 0 ? Math.round((this.totalCollected() / total) * 100) : 100;
  });

  filteredFees = computed(() => {
    const list = this.fees();
    const f = this.filter();
    const q = this.searchQuery.trim().toLowerCase();

    return list.filter(item => {
      const matchStatus = f === 'ALL' || item.status === f;
      const matchQuery = !q ||
        (item.studentName || '').toLowerCase().includes(q) ||
        (item.rollNumber || '').toLowerCase().includes(q) ||
        (item.feeType || '').toLowerCase().includes(q) ||
        (item.feeTypeDisplay || '').toLowerCase().includes(q) ||
        (item.semesterLabel || '').toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.getAllFees().subscribe({
      next: (f) => {
        this.fees.set(f);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load fee records.');
        this.loading.set(false);
      }
    });

    this.api.getAllStudents(0, 100).subscribe({
      next: (res) => this.students.set(res.content)
    });

    this.api.getAllSemesters().subscribe({
      next: (sems) => this.semesters.set(sems)
    });
  }

  openCreateModal(): void {
    this.newFee = {
      studentId: null,
      feeType: 'RETAKE',
      amount: 3000,
      semesterId: null,
      dueDate: '',
      description: ''
    };
    this.createError.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  submitCreateFee(): void {
    if (!this.newFee.studentId || !this.newFee.amount) {
      this.createError.set('Please select a student and specify the amount.');
      return;
    }

    this.creating.set(true);
    this.createError.set('');

    const req: FeeCreateRequest = {
      studentId: this.newFee.studentId,
      feeType: this.newFee.feeType,
      amount: this.newFee.amount,
      semesterId: this.newFee.semesterId || undefined,
      dueDate: this.newFee.dueDate || undefined,
      description: this.newFee.description || undefined
    };

    this.api.createFee(req).subscribe({
      next: () => {
        this.creating.set(false);
        this.closeCreateModal();
        this.toast.success('Fee invoice created successfully!');
        this.loadData();
      },
      error: (e) => {
        this.creating.set(false);
        const msg = e.error?.detail || e.error?.message || 'Failed to create fee invoice.';
        this.createError.set(msg);
        this.toast.error(msg);
      }
    });
  }

  openMarkPaidModal(fee: FeeResponse): void {
    this.selectedFee = fee;
    this.selectedPaymentMethod = 'CASH';
    this.showPaymentModal.set(true);
  }

  closePaymentModal(): void {
    this.showPaymentModal.set(false);
    this.selectedFee = null;
  }

  submitMarkAsPaid(): void {
    if (!this.selectedFee) return;

    this.paying.set(true);
    this.api.markFeeAsPaid(this.selectedFee.id, this.selectedPaymentMethod).subscribe({
      next: () => {
        this.paying.set(false);
        this.closePaymentModal();
        this.toast.success('Fee marked as PAID successfully! 🎉');
        this.loadData();
      },
      error: (e) => {
        this.paying.set(false);
        const msg = e.error?.detail || e.error?.message || 'Failed to update fee status.';
        this.toast.error(msg);
      }
    });
  }

  confirmMarkAsPaid(): void {
    // If confirm modal used
  }

  auditSemesterGapFines(): void {
    this.auditingGapFines.set(true);
    this.api.auditGapFines().subscribe({
      next: (generated) => {
        this.auditingGapFines.set(false);
        if (generated && generated.length > 0) {
          this.toast.success(`Audit Complete! Auto-generated ${generated.length} gap fine invoice(s) (10,000 BDT each). ⚡`);
        } else {
          this.toast.info('Audit Complete: All enrolled cohorts are up to date with zero un-assessed gap semesters.');
        }
        this.loadData();
      },
      error: (e) => {
        this.auditingGapFines.set(false);
        const msg = e.error?.detail || e.error?.message || 'Failed to run semester gap audit.';
        this.toast.error(msg);
      }
    });
  }

  downloadReceipt(fee: FeeResponse): void {
    this.pdfService.generateReceipt(fee, fee.studentName || 'Student', fee.rollNumber || '');
    this.toast.success(`Payment receipt for #${fee.id} downloaded!`);
  }

  feeTypeIcon(type: string): IconName {
    return FEE_TYPE_ICONS[type] ?? 'credit-card';
  }

  isOverdue(f: FeeResponse): boolean {
    return f.status === 'UNPAID' && !!f.dueDate && new Date(f.dueDate) < new Date();
  }

  avatarGradient(name: string): string {
    const gradients = [
      'linear-gradient(135deg, #22d3ee, #6366f1)',
      'linear-gradient(135deg, #a78bfa, #f472b6)',
      'linear-gradient(135deg, #34d399, #0ea5e9)',
      'linear-gradient(135deg, #fb923c, #f43f5e)',
      'linear-gradient(135deg, #fbbf24, #10b981)',
    ];
    const idx = (name || 'S').charCodeAt(0) % gradients.length;
    return gradients[idx];
  }
}
