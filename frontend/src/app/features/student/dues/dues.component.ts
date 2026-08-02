import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { FeeResponse } from '../../../core/models/models';
import { IconComponent, IconName } from '../../../shared/components/icon/icon.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ToastService } from '../../../core/services/toast.service';
import { ViewChild } from '@angular/core';

const FEE_TYPE_ICONS: Record<string, IconName> = {
  RETAKE: 'list-check',
  SEMESTER_GAP: 'calendar',
  REGISTRATION: 'credit-card',
  OTHER: 'credit-card'
};

@Component({
  selector: 'app-dues',
  standalone: true,
  imports: [CommonModule, IconComponent, ConfirmModalComponent],
  template: `
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-eyebrow">Student finance</div>
      <h1 class="page-title text-gradient-flow">Fees & Dues</h1>
      <p class="page-subtitle">Your complete fee history and outstanding payments</p>
    </div>
    <div *ngIf="!loading()">
      <div class="outstanding-amount" *ngIf="totalDues() > 0">
        <div class="outstanding-label">Outstanding Balance</div>
        <div class="outstanding-value">৳{{ totalDues() | number:'1.0-0' }}</div>
      </div>
      <div class="metric-chip metric-chip--green" *ngIf="totalDues() === 0">
        <app-icon name="check-circle" [size]="17"></app-icon> All Clear — No Dues
      </div>
    </div>
  </div>

  <div class="spinner-wrapper" *ngIf="loading()"><div class="spinner"></div></div>

  <app-confirm-modal #confirmModal (confirm)="confirmPayment()" />

  <!-- Summary stat cards -->
  <div class="stats-grid" *ngIf="!loading() && fees().length > 0">
    <div class="stat-card stat-card--red">
      <div class="stat-icon"><app-icon name="alert-triangle" [size]="22"></app-icon></div>
      <div class="stat-value">{{ unpaidCount() }}</div>
      <div class="stat-label">Unpaid Fees</div>
    </div>
    <div class="stat-card stat-card--green">
      <div class="stat-icon"><app-icon name="check-circle" [size]="22"></app-icon></div>
      <div class="stat-value">{{ paidCount() }}</div>
      <div class="stat-label">Paid Fees</div>
    </div>
    <div class="stat-card stat-card--purple">
      <div class="stat-icon"><app-icon name="wallet" [size]="22"></app-icon></div>
      <div class="stat-value">{{ fees().length }}</div>
      <div class="stat-label">Total Records</div>
    </div>
  </div>

  <!-- Filter tabs -->
  <div class="filter-tabs-bar" *ngIf="!loading() && fees().length > 0">
    <button class="filter-tab" [class.active]="filter() === 'ALL'" (click)="filter.set('ALL')">
      All <span class="filter-count">{{ fees().length }}</span>
    </button>
    <button class="filter-tab" [class.active]="filter() === 'UNPAID'" (click)="filter.set('UNPAID')">
      <span class="dot-unpaid"></span>Unpaid <span class="filter-count">{{ unpaidCount() }}</span>
    </button>
    <button class="filter-tab" [class.active]="filter() === 'PAID'" (click)="filter.set('PAID')">
      <span class="dot-paid"></span>Paid <span class="filter-count">{{ paidCount() }}</span>
    </button>
  </div>

  <!-- Invoice Cards -->
  <div class="invoice-grid" *ngIf="!loading()">
    <div class="invoice-card fade-in-up card-glow-border" *ngFor="let f of filteredFees(); let i = index"
         [style.animation-delay.ms]="i * 50"
         [class.invoice-unpaid]="f.status === 'UNPAID'"
         [class.invoice-paid]="f.status === 'PAID'"
         [class.invoice-waived]="f.status === 'WAIVED'">

      <!-- Card header -->
      <div class="invoice-header">
        <div class="invoice-type-icon">
          <app-icon [name]="feeTypeIcon(f.feeType)" [size]="18"></app-icon>
        </div>
        <div class="invoice-type-info">
          <div class="invoice-type-name">{{ f.feeTypeDisplay }}</div>
          <div class="invoice-semester" *ngIf="f.semesterLabel">{{ f.semesterLabel }}</div>
        </div>
        <div class="invoice-status-badge"
             [class.badge-unpaid]="f.status === 'UNPAID'"
             [class.badge-paid]="f.status === 'PAID'"
             [class.badge-waived]="f.status === 'WAIVED'">
          <span class="badge-dot" *ngIf="f.status === 'UNPAID'"></span>
          <svg *ngIf="f.status === 'PAID'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {{ f.status }}
        </div>
      </div>

      <!-- Amount -->
      <div class="invoice-amount">৳{{ f.amount | number:'1.0-0' }}</div>
      <div class="invoice-desc" *ngIf="f.description">{{ f.description }}</div>

      <!-- Dates -->
      <div class="invoice-dates">
        <div class="invoice-date-item" *ngIf="f.dueDate">
          <span class="date-label">Due</span>
          <span [class.overdue]="isOverdue(f)">{{ f.dueDate | date:'dd MMM yyyy' }}</span>
        </div>
        <div class="invoice-date-item" *ngIf="f.paidAt">
          <span class="date-label">Paid on</span>
          <span>{{ f.paidAt | date:'dd MMM yyyy' }}</span>
        </div>
        <div class="invoice-date-item" *ngIf="f.paymentMethod">
          <span class="date-label">Via</span>
          <span class="pm-badge">{{ f.paymentMethod }}</span>
        </div>
      </div>

      <!-- Pay action -->
      <div class="invoice-footer" *ngIf="f.status === 'UNPAID'">
        <div class="payment-options">
          <select #pmSelect class="pm-select">
            <option value="" disabled selected>Select Payment Method</option>
            <option value="BKASH">bKash</option>
            <option value="NAGAD">Nagad</option>
            <option value="ROCKET">Rocket</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>
          <button class="pay-btn magnetic" [class.paying]="payingId() === f.id"
                  [disabled]="payingId() === f.id || !pmSelect.value" (click)="payFee(f.id, pmSelect.value)">
            <svg *ngIf="payingId() !== f.id" width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <span class="paying-spinner" *ngIf="payingId() === f.id"></span>
            {{ payingId() === f.id ? 'Processing...' : 'Pay' }}
          </button>
        </div>
      </div>
      <div class="invoice-paid-confirm" *ngIf="f.status === 'PAID'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Payment confirmed
      </div>
    </div>
  </div>

  <div class="empty-state" *ngIf="!loading() && filteredFees().length === 0">
    <div class="empty-icon">
      <app-icon [name]="fees().length === 0 ? 'check-circle' : 'filter'" [size]="28"></app-icon>
    </div>
    <h3>{{ fees().length === 0 ? 'No fee records' : 'No matching fees' }}</h3>
    <p>{{ fees().length === 0 ? 'You have no fee history yet.' : 'Choose another filter to see records.' }}</p>
  </div>
</div>
  `,
  styles: [`
    /* Outstanding header amount */
    .outstanding-amount { text-align: right; }
    .outstanding-label  { font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .08em; }
    .outstanding-value  { font-size: 2rem; font-weight: 800; color: var(--accent-red); line-height: 1.1; }

    /* Filter tabs bar */
    .filter-tabs-bar {
      display: flex; gap: 0.5rem; margin-bottom: 1.5rem;
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
    .dot-unpaid, .dot-paid {
      width: 8px; height: 8px; border-radius: 50%; display: inline-block;
    }
    .dot-unpaid { background: var(--accent-red); }
    .dot-paid   { background: var(--accent-green); }

    /* Invoice grid */
    .invoice-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
    }
    .invoice-card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column;
      gap: 1rem; transition: all .25s; position: relative; overflow: hidden;
    }
    .invoice-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0;
      height: 3px; border-radius: 16px 16px 0 0;
    }
    .invoice-unpaid { border-color: rgba(248,113,113,0.25); }
    .invoice-unpaid::before { background: linear-gradient(90deg, #f87171, #fb923c); }
    .invoice-unpaid:hover { box-shadow: 0 8px 32px rgba(248,113,113,0.15); transform: translateY(-2px); }
    .invoice-paid   { border-color: rgba(52,211,153,0.2); opacity: 0.85; }
    .invoice-paid::before { background: linear-gradient(90deg, #34d399, #22d3ee); }
    .invoice-waived { border-color: rgba(167,139,250,0.2); opacity: 0.8; }

    /* Invoice header */
    .invoice-header { display: flex; align-items: flex-start; gap: 0.75rem; }
    .invoice-type-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: var(--bg-elevated); display: flex; align-items: center;
      justify-content: center; flex-shrink: 0; color: var(--text-secondary);
    }
    .invoice-type-info { flex: 1; }
    .invoice-type-name { font-weight: 600; font-size: 0.9rem; color: var(--text-primary); }
    .invoice-semester  { font-size: 0.775rem; color: var(--text-muted); margin-top: 0.15rem; }

    /* Status badges */
    .invoice-status-badge {
      display: flex; align-items: center; gap: 0.3rem;
      padding: 0.25rem 0.625rem; border-radius: 20px;
      font-size: 0.72rem; font-weight: 700; letter-spacing: 0.05em;
      flex-shrink: 0;
    }
    .badge-unpaid {
      background: rgba(248,113,113,0.15); color: var(--accent-red);
      border: 1px solid rgba(248,113,113,0.3);
    }
    .badge-paid {
      background: rgba(52,211,153,0.12); color: var(--accent-green);
      border: 1px solid rgba(52,211,153,0.25);
    }
    .badge-waived {
      background: rgba(167,139,250,0.12); color: var(--purple);
      border: 1px solid rgba(167,139,250,0.25);
    }
    .badge-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--accent-red);
      animation: pulse-badge 1.5s ease infinite;
    }
    @keyframes pulse-badge {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%  { transform: scale(1.4); opacity: 0.6; }
    }

    /* Amount */
    .invoice-amount { font-size: 2rem; font-weight: 800; line-height: 1; }
    .invoice-unpaid .invoice-amount { color: var(--accent-red); }
    .invoice-paid   .invoice-amount { color: var(--text-muted); }
    .invoice-desc { font-size: 0.82rem; color: var(--text-muted); }

    /* Dates */
    .invoice-dates { display: flex; gap: 1.5rem; flex-wrap: wrap; }
    .invoice-date-item { display: flex; flex-direction: column; gap: 0.15rem; }
    .date-label { font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
    .overdue { color: var(--accent-red); font-weight: 600; }

    /* Pay button */
    .invoice-footer {}
    .pay-btn {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      width: 100%; padding: 0.75rem; border-radius: 10px;
      background: linear-gradient(135deg, #f87171, #fb923c);
      color: #fff; font-weight: 600; font-size: 0.9rem;
      border: none; cursor: pointer; transition: all .2s;
      font-family: inherit;
    }
    .pay-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(248,113,113,0.4); }
    .pay-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .paying-spinner {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%; animation: spin .6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .payment-options {
      display: flex; gap: 0.5rem; width: 100%;
    }
    .pm-select {
      flex: 1; padding: 0.75rem; border-radius: 10px; border: 1px solid var(--border);
      background: var(--bg-elevated); color: var(--text-primary);
      font-size: 0.85rem; outline: none; font-family: inherit; font-weight: 500;
    }
    .pm-select:focus { border-color: var(--accent-primary); }
    .pm-badge {
      background: var(--bg-elevated); padding: 0.1rem 0.4rem; border-radius: 4px;
      font-size: 0.7rem; font-weight: 600; color: var(--text-primary);
    }

    .invoice-paid-confirm {
      display: flex; align-items: center; gap: 0.4rem;
      font-size: 0.82rem; color: var(--accent-green); font-weight: 500;
    }

    @media (max-width: 640px) {
      .invoice-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DuesComponent implements OnInit {
  fees     = signal<FeeResponse[]>([]);
  loading  = signal(true);
  payingId = signal<number | null>(null);
  filter   = signal<'ALL' | 'UNPAID' | 'PAID'>('ALL');
  error    = signal('');

  @ViewChild('confirmModal') confirmModal!: ConfirmModalComponent;
  pendingFeeId = signal<number | null>(null);
  pendingPaymentMethod = signal<string>('CASH');

  totalDues   = computed(() => this.fees().filter(f => f.status === 'UNPAID').reduce((s, f) => s + f.amount, 0));
  unpaidCount = computed(() => this.fees().filter(f => f.status === 'UNPAID').length);
  paidCount   = computed(() => this.fees().filter(f => f.status === 'PAID').length);
  filteredFees = computed(() => {
    const status = this.filter();
    return status === 'ALL' ? this.fees() : this.fees().filter(f => f.status === status);
  });

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void { this.loadFees(); }

  loadFees(): void {
    this.loading.set(true);
    this.api.getMyFees().subscribe({
      next: (f) => { this.fees.set(f); this.loading.set(false); },
      error: () => { this.error.set('Could not load your fee history.'); this.loading.set(false); }
    });
  }

  payFee(feeId: number, method: string): void {
    this.pendingFeeId.set(feeId);
    this.pendingPaymentMethod.set(method);
    this.confirmModal.title = 'Confirm Payment';
    this.confirmModal.message = `Are you sure you want to proceed with this payment via ${method.replace('_', ' ')}?`;
    this.confirmModal.iconName = 'credit-card';
    this.confirmModal.type = 'info';
    this.confirmModal.confirmText = 'Pay Now';
    this.confirmModal.open();
  }

  confirmPayment(): void {
    const feeId = this.pendingFeeId();
    const method = this.pendingPaymentMethod();
    if (!feeId) return;

    this.payingId.set(feeId);
    this.api.payMyFee(feeId, method).subscribe({
      next: () => {
        this.payingId.set(null);
        this.toast.success('Payment completed successfully! 🎉');
        this.loadFees();
      },
      error: () => {
        this.toast.error('Payment failed. Please try again.');
        this.payingId.set(null);
      }
    });
  }

  feeTypeIcon(type: string): IconName {
    return FEE_TYPE_ICONS[type] ?? 'credit-card';
  }

  isOverdue(f: FeeResponse): boolean {
    return f.status === 'UNPAID' && !!f.dueDate && new Date(f.dueDate) < new Date();
  }
}
