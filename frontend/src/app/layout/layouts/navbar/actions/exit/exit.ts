import { Component, Input, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-exit',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <button
      (click)="exit()"
      [disabled]="disabled"
      class="nav-action-btn nav-action-btn--exit"
      aria-label="Exit or Go Back"
    >
      <app-icon name="arrow-right" [size]="16" class="nav-action-icon" style="transform: rotate(180deg);"></app-icon>
      <span class="nav-action-label">Exit</span>
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
export class Exit {
  @Input() disabled = false;

  private location = inject(Location);
  private router = inject(Router);

  exit(): void {
    this.location.back();
  }
}
