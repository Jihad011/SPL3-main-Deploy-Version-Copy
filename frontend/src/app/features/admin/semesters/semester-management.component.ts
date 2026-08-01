import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SemesterResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-semester-management',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title text-gradient-flow">Semester Management</h1>
      <p class="page-subtitle">Control which semester is open for student enrollment</p>
    </div>
    <button class="btn btn-primary btn-neon" (click)="showModal.set(true)">
      <app-icon name="calendar" [size]="17"></app-icon>Add Semester
    </button>
  </div>

  <div class="alert alert-success" *ngIf="success()">✅ {{ success() }}</div>
  <div class="alert alert-error"   *ngIf="error()">⚠️ {{ error() }}</div>

  <!-- Semester List (Main View) -->
  <div class="card card-glow-border">
    <div class="card-header card-glow-border">
      <div class="card-title card-glow-border">All Semesters</div>
      <div class="card-sub card-glow-border">{{ semesters().length }} semesters total</div>
    </div>
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Semester</th>
            <th>Period</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let s of semesters()">
            <td><strong>{{ s.label }}</strong></td>
            <td style="font-size:0.8rem;color:var(--text-secondary)">
              {{ s.startDate | date:'dd MMM' }} – {{ s.endDate | date:'dd MMM yyyy' }}
            </td>
            <td>
              <span class="status-badge" [class.status-active]="s.isActive" [class.status-inactive]="!s.isActive">
                {{ s.isActive ? '● Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <button class="btn-primary btn-sm btn-neon" *ngIf="!s.isActive" (click)="activate(s)">Activate</button>
              <span *ngIf="s.isActive" class="text-muted">Current</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="empty-state" *ngIf="semesters().length === 0">
      <div class="empty-icon">📅</div>
      <h3>No semesters yet</h3>
    </div>
  </div>
</div>

<!-- Create Semester Modal -->
<div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
  <div class="modal-card" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <h2>Create New Semester</h2>
      <button class="btn-close" (click)="closeModal()" aria-label="Close dialog">
        <app-icon name="x" [size]="17"></app-icon>
      </button>
    </div>
    <div class="alert alert-error" *ngIf="modalError()">
      <app-icon name="alert-triangle" [size]="18"></app-icon>{{ modalError() }}
    </div>
    
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">Semester</label>
        <select [(ngModel)]="newSem.name" class="form-control">
          <option value="SPRING">🌸 Spring</option>
          <option value="SUMMER">☀️ Summer</option>
          <option value="FALL">🍂 Fall</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Year</label>
        <input type="number" [(ngModel)]="newSem.year" placeholder="2026" class="form-control" />
      </div>
      <div class="form-group">
        <label class="form-label">Start Date</label>
        <input type="date" [(ngModel)]="newSem.startDate" class="form-control" />
      </div>
      <div class="form-group">
        <label class="form-label">End Date</label>
        <input type="date" [(ngModel)]="newSem.endDate" class="form-control" />
      </div>
      <div class="form-group form-grid-wide" style="margin-top: 0.5rem;">
        <label style="display:flex; align-items:center; gap: 0.75rem; cursor:pointer;">
          <input type="checkbox" [(ngModel)]="newSem.makeActive" style="width: 1.25rem; height: 1.25rem;" />
          Activate immediately (opens enrollment)
        </label>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
      <button type="button" class="btn btn-primary btn-neon" (click)="createSemester()" [disabled]="saving()">
        {{ saving() ? 'Creating...' : 'Create Semester' }}
      </button>
    </div>
  </div>
</div>
  `
})
export class SemesterManagementComponent implements OnInit {
  semesters  = signal<SemesterResponse[]>([]);
  saving     = signal(false);
  success    = signal('');
  error      = signal('');
  modalError = signal('');
  showModal  = signal(false);
  newSem     = { name: 'SPRING', year: new Date().getFullYear(), startDate: '', endDate: '', makeActive: false };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getAllSemesters().subscribe({ next: s => this.semesters.set(s) });
  }

  closeModal(): void {
    this.showModal.set(false);
    this.modalError.set('');
  }

  createSemester(): void {
    if (!this.newSem.startDate || !this.newSem.endDate) {
      this.modalError.set('Start Date and End Date are required.');
      return;
    }
    
    this.saving.set(true); 
    this.modalError.set('');
    
    this.api.createSemester(this.newSem).subscribe({
      next: (s) => {
        this.semesters.update(arr => [s, ...arr]);
        this.success.set(`Semester ${s.label} created successfully!`);
        this.saving.set(false);
        this.closeModal();
      },
      error: (e) => { 
        this.modalError.set(e.error?.detail || e.error?.message || 'Failed to create semester.'); 
        this.saving.set(false); 
      }
    });
  }

  activate(sem: SemesterResponse): void {
    this.api.activateSemester(sem.id).subscribe({
      next: () => {
        this.success.set(`${sem.label} is now the active semester.`);
        this.api.getAllSemesters().subscribe(s => this.semesters.set(s));
      }
    });
  }
}
