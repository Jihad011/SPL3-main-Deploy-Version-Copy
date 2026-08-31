import { Component, Input, effect, signal } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ONCLICK_DELETE, FormGroupSignal } from '../../../../../shared/constant/button-signals.constant';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-delete',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <button
      (click)="delete()"
      [disabled]="disabled"
      class="nav-action-btn nav-action-btn--delete"
      aria-label="Delete Record"
    >
      <app-icon name="trash" [size]="16" class="nav-action-icon"></app-icon>
      <span class="nav-action-label">Delete</span>
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
      border: 1px solid rgba(239, 68, 68, 0.4);
      background: #dc2626;
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
export class Delete {
  @Input() disabled = false;

  frmGroup = signal<FormGroup>(FormGroupSignal());

  constructor() {
    effect(() => {
      this.frmGroup.set(FormGroupSignal());
    }, { allowSignalWrites: true });
  }


  delete(): void {
    ONCLICK_DELETE.set(true);
  }
}
