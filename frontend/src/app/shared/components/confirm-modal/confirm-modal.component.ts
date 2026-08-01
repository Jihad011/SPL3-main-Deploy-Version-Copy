import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="modal-overlay" *ngIf="isOpen()" (click)="close()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header">
          <div class="modal-title-wrapper">
            <div class="modal-icon" [ngClass]="type">
              <app-icon [name]="iconName" [size]="20" />
            </div>
            <h3 class="modal-title">{{ title }}</h3>
          </div>
          <button class="btn-close" (click)="close()">
            <app-icon name="x" [size]="18" />
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <p>{{ message }}</p>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="close()">{{ cancelText }}</button>
          <button class="btn" [ngClass]="type === 'danger' ? 'btn-danger' : 'btn-primary'" (click)="confirmAction()">
            {{ confirmText }}
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-title-wrapper {
      display: flex; align-items: center; gap: 0.75rem;
    }
    .modal-title { margin: 0; font-size: 1.1rem; font-weight: 600; }
    .modal-icon {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .modal-icon.warning { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .modal-icon.danger { background: rgba(239,68,68,0.15); color: #ef4444; }
    .modal-icon.info { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .modal-title-wrapper { display: flex; align-items: center; gap: 0.75rem; }
    .modal-icon {
      width: 36px; height: 36px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .modal-icon.danger { background: rgba(239, 68, 68, 0.1); color: var(--accent-red); }
    .modal-icon.warning { background: rgba(245, 158, 11, 0.1); color: var(--accent-orange); }
    .modal-icon.info { background: rgba(59, 130, 246, 0.1); color: var(--accent-primary); }
    
    .modal-title { font-size: 1.1rem; font-weight: 600; margin: 0; color: var(--text-primary); }
    .btn-close {
      background: none; border: none; color: var(--text-muted);
      cursor: pointer; padding: 0.25rem; border-radius: 6px; transition: all 0.2s;
    }
    .btn-close:hover { background: var(--bg-elevated); color: var(--text-primary); }
    
    .modal-body { padding: 1.5rem; color: var(--text-secondary); line-height: 1.5; font-size: 0.95rem; }
    .modal-body p { margin: 0; }
    
    .modal-footer {
      padding: 1.25rem 1.5rem; background: var(--bg-elevated);
      border-top: 1px solid var(--border);
      display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem;
    }
    
    .btn-danger {
      background: var(--accent-red); color: white; border: none;
      padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 500;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-danger:hover { filter: brightness(1.1); transform: translateY(-1px); }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(15px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
  `]
})
export class ConfirmModalComponent {
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() type: 'danger' | 'warning' | 'info' = 'warning';
  @Input() iconName: IconName = 'alert-triangle';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  isOpen = signal(false);

  open() { this.isOpen.set(true); }
  
  close() {
    this.isOpen.set(false);
    this.cancel.emit();
  }

  confirmAction() {
    this.isOpen.set(false);
    this.confirm.emit();
  }
}
