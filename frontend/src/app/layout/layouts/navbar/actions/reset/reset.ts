import { Component, Input, effect, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ONCLICK_RESET, FormGroupSignal } from '../../../../../shared/constant/button-signals.constant';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-reset',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <button
      (click)="reset()"
      [disabled]="disabled"
      class="nav-action-btn nav-action-btn--reset"
      aria-label="Reset Form"
    >
      <app-icon name="refresh" [size]="16" class="nav-action-icon"></app-icon>
      <span class="nav-action-label">Reset</span>
    </button>
  `,
  styles: [`
    .nav-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.85rem;
      height: 32px;
      font-size: 0.8125rem;
      font-weight: 600;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.25);
      background: var(--theme-primary, #086AD8);
      color: #ffffff;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    .nav-action-btn:hover:not(:disabled) {
      background: var(--theme-secondary, #0456b8);
      border-color: rgba(255,255,255,0.4);
      transform: translateY(-1px);
      box-shadow: 0 3px 6px rgba(0,0,0,0.15);
    }
    .nav-action-btn:active:not(:disabled) {
      transform: translateY(0);
    }
    .nav-action-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .nav-action-icon { display: flex; align-items: center; }
  `]
})
export class Reset {
  @Input() disabled = false;

  frmGroup = signal<FormGroup>(FormGroupSignal());

  constructor() {
    effect(() => {
      this.frmGroup.set(FormGroupSignal());
    }, { allowSignalWrites: true });
  }


  reset(): void {
    ONCLICK_RESET.set(true);
  }
}
