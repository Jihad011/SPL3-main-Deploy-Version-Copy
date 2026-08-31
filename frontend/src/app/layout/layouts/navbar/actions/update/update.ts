import { Component, Input, WritableSignal, effect, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ONCLICK_UPDATE, FormGroupSignal } from '../../../../../shared/constant/button-signals.constant';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-update',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <button
      (click)="update()"
      [disabled]="disabled || frmGroup().invalid"
      class="nav-action-btn nav-action-btn--update"
      [attr.aria-label]="label"
    >
      <app-icon name="edit" [size]="16" class="nav-action-icon"></app-icon>
      <span class="nav-action-label">{{ label }}</span>
    </button>
  `,
  styles: [`
    .nav-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.85rem;
      font-size: 0.825rem;
      font-weight: 600;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.15);
      background: var(--theme-secondary, #0456b8);
      color: #ffffff;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    }
    .nav-action-btn:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.18);
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
export class Update {
  @Input() label = 'Update';
  @Input() clickSignal: WritableSignal<boolean> = ONCLICK_UPDATE;
  @Input() disabled = false;

  frmGroup = signal<FormGroup>(FormGroupSignal());

  constructor() {
    effect(() => {
      this.frmGroup.set(FormGroupSignal());
    }, { allowSignalWrites: true });
  }


  update(): void {
    this.clickSignal.set(true);
  }
}
