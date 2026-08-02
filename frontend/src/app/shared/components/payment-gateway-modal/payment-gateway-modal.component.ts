import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-payment-gateway-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="modal-overlay" *ngIf="isOpen()" (click)="close()">
      <div class="modal-container" [ngClass]="getThemeClass()" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header">
          <div class="brand-logo">
            <app-icon [name]="getBrandIcon()" [size]="28"></app-icon>
          </div>
          <div class="brand-info">
            <h2>{{ getBrandName() }} Checkout</h2>
            <p>Secure SSL Gateway</p>
          </div>
          <button class="close-btn" (click)="close()">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <div class="amount-display">
            <div class="amount-label">Total Amount to Pay</div>
            <div class="amount-value">৳{{ amount() | number:'1.0-0' }}</div>
          </div>

          <!-- Simulation Steps -->
          <div class="simulation-area">
            <!-- Step 1: Input Details -->
            <div class="step-input" *ngIf="step() === 'INPUT'">
              <!-- Mobile Wallet Form -->
              <div *ngIf="isMobileWallet()">
                <div class="form-group">
                  <label>Your {{ getBrandName() }} Account Number</label>
                  <input type="text" placeholder="e.g 01XXXXXXXXX" [(ngModel)]="accountNumber" maxlength="11">
                </div>
              </div>
              
              <!-- Card Form -->
              <div *ngIf="isCard()">
                <div class="form-group">
                  <label>Card Number</label>
                  <input type="text" placeholder="XXXX-XXXX-XXXX-XXXX" [(ngModel)]="cardNumber" maxlength="19">
                </div>
                <div class="form-row">
                  <div class="form-group flex-1">
                    <label>Expiry (MM/YY)</label>
                    <input type="text" placeholder="MM/YY" maxlength="5">
                  </div>
                  <div class="form-group flex-1">
                    <label>CVV</label>
                    <input type="password" placeholder="***" maxlength="3">
                  </div>
                </div>
              </div>

                <!-- Cash Form -->
              <div *ngIf="isCash()">
                <div class="cash-info">
                  <app-icon name="alert-triangle" [size]="24"></app-icon>
                  <p>You have selected Cash Payment. Please pay at the University Accounts office to complete the transaction.</p>
                </div>
              </div>

              <!-- Generic Bank Transfer -->
              <div *ngIf="isBankTransfer()">
                <div class="form-group">
                  <label>Bank Account Number</label>
                  <input type="text" placeholder="Enter 13-digit account number" [(ngModel)]="accountNumber" maxlength="20">
                </div>
              </div>

              <button class="action-btn" [disabled]="!canProceed()" (click)="proceedToOtp()">
                {{ isCash() ? 'Confirm Intent to Pay' : 'Proceed' }}
              </button>
            </div>

            <!-- Step 2: OTP (Only for Digital) -->
            <div class="step-otp" *ngIf="step() === 'OTP' && !isCash()">
              <h3>Verification Code</h3>
              <p>An OTP has been sent to your {{ isMobileWallet() ? 'number' : 'registered phone' }}.</p>
              <div class="otp-inputs">
                <input type="text" maxlength="1" class="otp-box">
                <input type="text" maxlength="1" class="otp-box">
                <input type="text" maxlength="1" class="otp-box">
                <input type="text" maxlength="1" class="otp-box">
              </div>
              <button class="action-btn mt-3" (click)="verifyOtp()">Verify & Pay</button>
            </div>

            <!-- Step 3: Processing -->
            <div class="step-processing" *ngIf="step() === 'PROCESSING'">
              <div class="spinner-ring"></div>
              <h3>Processing Transaction...</h3>
              <p>Please do not close this window or press back.</p>
            </div>
            
            <!-- Step 4: Success -->
            <div class="step-success" *ngIf="step() === 'SUCCESS'">
              <div class="success-check">
                <app-icon name="check-circle" [size]="32"></app-icon>
              </div>
              <h3>Payment Successful!</h3>
              <p>Redirecting back to dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      display: flex; justify-content: center; align-items: center; z-index: 9999;
      animation: fadeIn 0.2s ease;
    }
    .modal-container {
      background: var(--bg-card); width: 90%; max-width: 420px;
      border-radius: 20px; overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border: 1px solid var(--border);
    }
    
    /* Themes */
    .theme-bkash .modal-header { background: linear-gradient(135deg, #e2136e, #ff4c99); color: white; }
    .theme-bkash .action-btn { background: #e2136e; color: white; }
    
    .theme-nagad .modal-header { background: linear-gradient(135deg, #f7931e, #ff6b00); color: white; }
    .theme-nagad .action-btn { background: #f7931e; color: white; }
    
    .theme-rocket .modal-header { background: linear-gradient(135deg, #8c238b, #ba38b8); color: white; }
    .theme-rocket .action-btn { background: #8c238b; color: white; }
    
    .theme-card .modal-header { background: linear-gradient(135deg, #1e3c72, #2a5298); color: white; }
    .theme-card .action-btn { background: #1e3c72; color: white; }

    .theme-cash .modal-header { background: linear-gradient(135deg, #10b981, #059669); color: white; }
    .theme-cash .action-btn { background: #10b981; color: white; }
    
    .theme-bank .modal-header { background: linear-gradient(135deg, #0f766e, #0d9488); color: white; }
    .theme-bank .action-btn { background: #0f766e; color: white; }

    .modal-header {
      padding: 1.5rem; display: flex; align-items: center; gap: 1rem; position: relative;
    }
    .brand-logo { background: rgba(255,255,255,0.2); padding: 0.5rem; border-radius: 12px; }
    .brand-info h2 { margin: 0; font-size: 1.2rem; font-weight: 700; }
    .brand-info p { margin: 0; font-size: 0.8rem; opacity: 0.8; }
    .close-btn { 
      position: absolute; right: 1rem; top: 1.5rem; background: none; border: none; 
      color: white; cursor: pointer; opacity: 0.7; transition: opacity 0.2s;
    }
    .close-btn:hover { opacity: 1; }

    .modal-body { padding: 2rem; }
    
    .amount-display { text-align: center; margin-bottom: 2rem; }
    .amount-label { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
    .amount-value { font-size: 2.5rem; font-weight: 800; color: var(--text-primary); }

    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.4rem; font-weight: 500; }
    .form-group input { 
      width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border);
      background: var(--bg-elevated); color: var(--text-primary); font-size: 1rem; outline: none; transition: border 0.2s;
    }
    .form-group input:focus { border-color: var(--accent-primary); }
    .form-row { display: flex; gap: 1rem; }
    .flex-1 { flex: 1; }

    .cash-info { background: rgba(16,185,129,0.1); padding: 1rem; border-radius: 8px; display: flex; gap: 1rem; align-items: flex-start; color: var(--text-primary); margin-bottom: 1.5rem; }
    .cash-info p { margin: 0; font-size: 0.9rem; line-height: 1.4; }

    .action-btn { 
      width: 100%; padding: 1rem; border: none; border-radius: 10px;
      font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-top: 1rem; color: white;
    }
    .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .action-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    
    .step-otp { text-align: center; }
    .step-otp h3 { margin: 0 0 0.5rem 0; color: var(--text-primary); }
    .step-otp p { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem; }
    .otp-inputs { display: flex; justify-content: center; gap: 0.5rem; }
    .otp-box { width: 45px; height: 50px; text-align: center; font-size: 1.5rem; font-weight: 600; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-elevated); color: var(--text-primary); outline: none; }
    .otp-box:focus { border-color: var(--accent-primary); }
    .mt-3 { margin-top: 1.5rem; }

    .step-processing { text-align: center; padding: 2rem 0; }
    .spinner-ring { 
      width: 50px; height: 50px; border: 4px solid var(--border); border-top-color: var(--accent-primary); 
      border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem auto; 
    }
    .step-processing h3 { margin: 0 0 0.5rem 0; color: var(--text-primary); }
    .step-processing p { color: var(--text-muted); font-size: 0.9rem; }
    
    .step-success { text-align: center; padding: 2rem 0; }
    .success-check { 
      width: 60px; height: 60px; background: var(--accent-green); color: white;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.5rem auto; animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .step-success h3 { margin: 0 0 0.5rem 0; color: var(--text-primary); }
    .step-success p { color: var(--text-muted); font-size: 0.9rem; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PaymentGatewayModalComponent {
  isOpen = signal(false);
  amount = signal(0);
  method = signal('');
  feeId = signal<number | null>(null);

  step = signal<'INPUT' | 'OTP' | 'PROCESSING' | 'SUCCESS'>('INPUT');
  
  accountNumber = '';
  cardNumber = '';

  @Output() paymentComplete = new EventEmitter<{feeId: number, method: string}>();

  open(feeId: number, amount: number, method: string) {
    this.feeId.set(feeId);
    this.amount.set(amount);
    this.method.set(method);
    this.step.set('INPUT');
    this.accountNumber = '';
    this.cardNumber = '';
    this.isOpen.set(true);
  }

  close() {
    if (this.step() === 'PROCESSING') return; // prevent closing while processing
    this.isOpen.set(false);
  }

  getBrandName(): string {
    switch(this.method()) {
      case 'BKASH': return 'bKash';
      case 'NAGAD': return 'Nagad';
      case 'ROCKET': return 'Rocket';
      case 'CREDIT_CARD': return 'Credit Card';
      case 'BANK_TRANSFER': return 'Bank Transfer';
      case 'CASH': return 'University Cash Counter';
      default: return 'Secure';
    }
  }

  getBrandIcon(): any {
    switch(this.method()) {
      case 'BKASH': case 'NAGAD': case 'ROCKET': return 'wallet';
      case 'CREDIT_CARD': return 'credit-card';
      case 'BANK_TRANSFER': return 'wallet';
      case 'CASH': return 'wallet';
      default: return 'lock';
    }
  }

  getThemeClass(): string {
    switch(this.method()) {
      case 'BKASH': return 'theme-bkash';
      case 'NAGAD': return 'theme-nagad';
      case 'ROCKET': return 'theme-rocket';
      case 'CREDIT_CARD': return 'theme-card';
      case 'BANK_TRANSFER': return 'theme-bank';
      case 'CASH': return 'theme-cash';
      default: return 'theme-bank';
    }
  }

  isMobileWallet(): boolean {
    return ['BKASH', 'NAGAD', 'ROCKET'].includes(this.method());
  }

  isCard(): boolean {
    return this.method() === 'CREDIT_CARD';
  }

  isCash(): boolean {
    return this.method() === 'CASH';
  }

  isBankTransfer(): boolean {
    return this.method() === 'BANK_TRANSFER';
  }

  canProceed(): boolean {
    if (this.isCash()) return true;
    if (this.isMobileWallet()) return this.accountNumber.length >= 11;
    if (this.isCard()) return this.cardNumber.length >= 10;
    if (this.isBankTransfer()) return this.accountNumber.length >= 10;
    return true; 
  }

  proceedToOtp() {
    if (this.isCash()) {
      // Cash doesn't need OTP, go straight to processing
      this.step.set('PROCESSING');
      this.simulateBankDelay();
    } else {
      this.step.set('OTP');
    }
  }

  verifyOtp() {
    this.step.set('PROCESSING');
    this.simulateBankDelay();
  }

  private simulateBankDelay() {
    // Simulate real-time banking network delay (2.5 seconds)
    setTimeout(() => {
      this.step.set('SUCCESS');
      
      // Let success animation play for 1.5 seconds, then emit event to caller
      setTimeout(() => {
        const id = this.feeId();
        if (id !== null) {
          this.paymentComplete.emit({ feeId: id, method: this.method() });
        }
        this.close();
      }, 1500);

    }, 2500);
  }
}
