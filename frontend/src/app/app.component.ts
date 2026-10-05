import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastService } from './core/services/toast.service';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <router-outlet />
    
    <div class="toast-container">

      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [ngClass]="toast.type" @fadeSlideInOut>
          <div class="toast-icon">
            @if (toast.type === 'error') {
              <i class="fas fa-exclamation-circle"></i>
            } @else if (toast.type === 'success') {
              <i class="fas fa-check-circle"></i>
            } @else {
              <i class="fas fa-info-circle"></i>
            }
          </div>
          <div class="toast-message">{{ toast.message }}</div>
          <button class="toast-close" (click)="toastService.remove(toast.id)">&times;</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-radius: 12px;
      background: rgba(17, 24, 39, 0.9);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      min-width: 300px;
      max-width: 400px;
    }
    .toast.error { border-left: 4px solid var(--error); }
    .toast.success { border-left: 4px solid var(--success); }
    .toast.info { border-left: 4px solid var(--accent-primary); }
    
    .toast-icon { font-size: 1.25rem; }
    .error .toast-icon { color: var(--error); }
    .success .toast-icon { color: var(--success); }
    .info .toast-icon { color: var(--accent-primary); }
    
    .toast-message { flex: 1; font-size: 0.9rem; line-height: 1.4; font-weight: 500; }
    .toast-close {
      background: none; border: none; color: rgba(255,255,255,0.5);
      font-size: 1.5rem; cursor: pointer; padding: 0; line-height: 1;
      transition: color 0.2s;
    }
    .toast-close:hover { color: white; }
  `],
  animations: [
    trigger('fadeSlideInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(100%)' }),
        animate('300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.8)' }))
      ])
    ])
  ]
})
export class AppComponent {
  toastService = inject(ToastService);
}
