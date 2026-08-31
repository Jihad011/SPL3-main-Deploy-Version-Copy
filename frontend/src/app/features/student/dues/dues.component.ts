import { Component, OnInit, signal, computed, inject, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { FeeResponse } from '../../../core/models/models';
import { IconComponent, IconName } from '../../../shared/components/icon/icon.component';
import { PaymentGatewayModalComponent } from '../../../shared/components/payment-gateway-modal/payment-gateway-modal.component';
import { PdfService } from '../../../core/services/pdf.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthStateService } from '../../../core/services/auth-state.service';

// CenterPoint Shared Components
import {
  SummaryCardStrip,
  SummaryCardItem,
  GenericButton
} from '../../../shared';

const FEE_TYPE_ICONS: Record<string, IconName> = {
  RETAKE: 'list-check',
  SEMESTER_GAP: 'calendar',
  REGISTRATION: 'credit-card',
  OTHER: 'credit-card'
};

@Component({
  selector: 'app-dues',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
    IconComponent,
    PaymentGatewayModalComponent,
    SummaryCardStrip,
    GenericButton
  ],
  template: `
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-eyebrow">Student finance</div>
      <h1 class="page-title">Fees & Dues</h1>
      <p class="page-subtitle">Your complete fee history and online payment portal</p>
    </div>
    <div *ngIf="!loading()">
      <div class="outstanding-amount" *ngIf="totalDues() > 0">
        <div class="outstanding-label">Outstanding Balance</div>
        <div class="outstanding-value font-mono">৳{{ totalDues() | number:'1.0-0' }}</div>
      </div>
      <div class="metric-chip metric-chip--green" *ngIf="totalDues() === 0">
        <app-icon name="check-circle" [size]="17"></app-icon> All Clear — No Pending Dues
      </div>
    </div>
  </div>

  <div class="spinner-wrapper" *ngIf="loading()"><div class="spinner"></div></div>

  <app-payment-gateway-modal #gatewayModal (paymentComplete)="onGatewayPaymentComplete($event)" />

  <!-- Summary Card Strip -->
  <div style="margin-bottom: 1.5rem;" *ngIf="!loading() && fees().length > 0">
    <app-summary-card-strip [items]="summaryItems()" displayMode="page" />
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
    <div class="invoice-card" *ngFor="let f of filteredFees(); let i = index"
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
      <div class="invoice-amount font-mono">৳{{ f.amount | number:'1.0-0' }}</div>
      <div class="invoice-desc" *ngIf="f.description">{{ f.description }}</div>

      <!-- Dates -->
      <div class="invoice-dates">
        <div class="invoice-date-item" *ngIf="f.dueDate">
          <span class="date-label">Due Date</span>
          <span [class.overdue]="isOverdue(f)">{{ f.dueDate | date:'dd MMM yyyy' }}</span>
        </div>
        <div class="invoice-date-item" *ngIf="f.paidAt">
          <span class="date-label">Paid on</span>
          <span>{{ f.paidAt | date:'dd MMM yyyy' }}</span>
        </div>
      </div>

      <div class="invoice-paid-confirm" *ngIf="f.status === 'PAID'">
        <div class="paid-content">
          <app-icon name="check-circle" [size]="20" class="paid-icon"></app-icon>
          <span>Payment confirmed via {{ f.paymentMethod ? f.paymentMethod.replace('_', ' ') : 'N/A' }}</span>
        </div>
        <button class="download-receipt-btn magnetic" (click)="downloadReceipt(f)">
          <app-icon name="download" [size]="16"></app-icon> Download Receipt
        </button>
      </div>

      <!-- Pay action -->
      <div class="invoice-footer" *ngIf="f.status === 'UNPAID'">
        <div class="payment-options">
          <select #pmSelect class="pm-select">
            <option value="" disabled selected>Select Payment Method</option>
            <option value="BKASH">bKash Online</option>
            <option value="NAGAD">Nagad Mobile</option>
            <option value="ROCKET">Rocket</option>
            <option value="CREDIT_CARD">Credit / Debit Card</option>
            <option value="BANK_TRANSFER">Bank Deposit</option>
          </select>
          <generic-button
            label="Pay Now"
            icon="credit-card"
            [enable]="payingId() !== f.id"
            styles="background: linear-gradient(135deg, #f87171, #fb923c); color: white;"
            (onClick)="payFee(f.id, f.amount, pmSelect.value || 'BKASH')"
          />
        </div>
      </div>
    </div>
  </div>

  <div class="empty-state" *ngIf="!loading() && filteredFees().length === 0">
    <div class="empty-icon"><app-icon name="check-circle" [size]="28"></app-icon></div>
    <h3>No invoices found</h3>
    <p>You have no records under this filter view.</p>
  </div>
</div>
  `,
  styles: [`
    .outstanding-amount {
      text-align: right;
    }
    .outstanding-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .outstanding-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--accent-red, #ef4444);
    }
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
    .filter-tabs-bar {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 0;
      margin-bottom: 1.25rem;
    }
    .filter-tab {
      padding: 0.6rem 1rem;
      border: none;
      background: none;
      color: var(--text-muted);
      font-size: 0.875rem;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      transition: all 0.2s;
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
    .dot-unpaid { width: 8px; height: 8px; border-radius: 50%; background: var(--accent-red, #ef4444); display: inline-block; }
    .dot-paid   { width: 8px; height: 8px; border-radius: 50%; background: var(--accent-green, #10b981); display: inline-block; }

    .invoice-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1.25rem;
    }
    .invoice-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      transition: all 0.2s;
    }
    .invoice-card:hover {
      border-color: var(--accent-primary);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }
    .invoice-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .invoice-type-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(34, 211, 238, 0.1);
      color: var(--accent-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .invoice-type-info { flex: 1; }
    .invoice-type-name { font-weight: 700; font-size: 0.95rem; color: var(--text-primary); }
    .invoice-semester { font-size: 0.75rem; color: var(--text-muted); }
    .invoice-status-badge {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-unpaid { background: rgba(239, 68, 68, 0.12); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.25); }
    .badge-paid { background: rgba(16, 185, 129, 0.12); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.25); }
    .badge-waived { background: rgba(168, 85, 247, 0.12); color: #a855f7; border: 1px solid rgba(168, 85, 247, 0.25); }
    .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #ef4444; }

    .invoice-amount { font-size: 1.75rem; font-weight: 800; line-height: 1; }
    .invoice-unpaid .invoice-amount { color: var(--accent-red, #ef4444); }
    .invoice-paid .invoice-amount { color: var(--text-muted); }
    .invoice-desc { font-size: 0.82rem; color: var(--text-muted); }
    .invoice-dates { display: flex; gap: 1.5rem; }
    .invoice-date-item { display: flex; flex-direction: column; gap: 0.15rem; }
    .date-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .overdue { color: #ef4444; font-weight: 600; }

    .payment-options { display: flex; gap: 0.5rem; width: 100%; }
    .pm-select {
      flex: 1;
      padding: 0.6rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg-elevated);
      color: var(--text-primary);
      font-size: 0.85rem;
      outline: none;
    }
    .invoice-paid-confirm {
      padding: 0.85rem;
      border-radius: 8px;
      background: rgba(16, 185, 129, 0.06);
      color: var(--accent-green, #10b981);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      font-size: 0.85rem;
      flex-wrap: wrap;
    }
    .paid-content { display: flex; align-items: center; gap: 0.5rem; }
    .download-receipt-btn {
      background: none;
      border: 1px solid var(--accent-green, #10b981);
      color: var(--accent-green, #10b981);
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.2s;
    }
    .download-receipt-btn:hover { background: var(--accent-green, #10b981); color: white; }
  `]
})
export class DuesComponent implements OnInit {
  fees = signal<FeeResponse[]>([]);
  loading = signal(true);
  payingId = signal<number | null>(null);
  filter = signal<'ALL' | 'UNPAID' | 'PAID'>('ALL');
  error = signal('');

  @ViewChild('gatewayModal') gatewayModal!: PaymentGatewayModalComponent;

  private pdfService = inject(PdfService);
  private toast = inject(ToastService);
  private auth = inject(AuthStateService);
  private api = inject(ApiService);

  totalDues = computed(() => this.fees().filter(f => f.status === 'UNPAID').reduce((s, f) => s + f.amount, 0));
  gapFineTotal = computed(() => this.fees().filter(f => f.feeType === 'SEMESTER_GAP' && f.status === 'UNPAID').reduce((s, f) => s + f.amount, 0));
  paidTotal = computed(() => this.fees().filter(f => f.status === 'PAID').reduce((s, f) => s + f.amount, 0));
  unpaidCount = computed(() => this.fees().filter(f => f.status === 'UNPAID').length);
  paidCount = computed(() => this.fees().filter(f => f.status === 'PAID').length);

  summaryItems = computed<SummaryCardItem[]>(() => [
    { key: 'dues', label: 'Outstanding Dues', value: `৳${this.totalDues().toLocaleString()}`, tone: 'danger', icon: 'failed' },
    { key: 'gapFines', label: 'Semester Gap Fines', value: `৳${this.gapFineTotal().toLocaleString()}`, tone: 'warning', icon: 'pause' },
    { key: 'paid', label: 'Paid Invoices', value: `৳${this.paidTotal().toLocaleString()}`, tone: 'success', icon: 'completed' },
    { key: 'total', label: 'Total Invoices', value: this.fees().length, tone: 'neutral', icon: 'info' }
  ]);

  filteredFees = computed(() => {
    const status = this.filter();
    return status === 'ALL' ? this.fees() : this.fees().filter(f => f.status === status);
  });

  ngOnInit(): void {
    this.loadFees();
  }

  loadFees(): void {
    this.loading.set(true);
    this.api.getMyFees().subscribe({
      next: (f) => { this.fees.set(f); this.loading.set(false); },
      error: () => { this.error.set('Could not load your fee history.'); this.loading.set(false); }
    });
  }

  payFee(feeId: number, amount: number, method: string): void {
    this.gatewayModal.open(feeId, amount, method);
  }

  onGatewayPaymentComplete(event: { feeId: number, method: string }): void {
    this.payingId.set(event.feeId);
    this.api.payMyFee(event.feeId, event.method).subscribe({
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

  downloadReceipt(fee: FeeResponse): void {
    const user = this.auth.user();
    const userName = user?.name || 'Student';
    const userRoll = user?.rollNumber || '';
    this.pdfService.generateReceipt(fee, userName, userRoll);
    this.toast.success('Receipt downloaded successfully!');
  }

  feeTypeIcon(type: string): IconName {
    return FEE_TYPE_ICONS[type] ?? 'credit-card';
  }

  isOverdue(f: FeeResponse): boolean {
    return f.status === 'UNPAID' && !!f.dueDate && new Date(f.dueDate) < new Date();
  }
}
