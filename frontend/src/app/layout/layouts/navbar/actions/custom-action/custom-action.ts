import { Component, Input, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ONCLICK_CUSTOM_ACTION, BUTTON_VISIBILITY } from '../../../../../shared/constant/button-signals.constant';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';

@Component({
  selector: 'custom-action',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <button
      (click)="customAction()"
      [disabled]="disabled"
      class="nav-action-btn"
      *ngIf="buttons().customButton"
    >
      <app-icon name="plus" [size]="16"></app-icon>
      <span>{{ label }}</span>
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
      background: var(--theme-primary, #086AD8);
      color: #ffffff;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .nav-action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class CustomAction {
  @Input() clickSignal: WritableSignal<boolean> = ONCLICK_CUSTOM_ACTION;
  @Input() disabled = false;
  buttons = BUTTON_VISIBILITY;

  get label(): string {
    return this.buttons()?.customButton?.customLevel || 'Action';
  }

  customAction(): void {
    this.clickSignal.set(true);
  }
}
