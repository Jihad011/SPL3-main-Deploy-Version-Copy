import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { SemesterResponse } from '../../../core/models/models';

@Component({
  selector: 'app-semester-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title text-gradient-flow">Semester Management</h1>
      <p class="page-subtitle">Control which semester is open for student enrollment</p>
    </div>
  </div>

  <div class="alert alert-success" *ngIf="success()">✅ {{ success() }}</div>
  <div class="alert alert-error"   *ngIf="error()">⚠️ {{ error() }}</div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;align-items:start">
    <!-- Create Semester Form -->
    <div class="card card-glow-border">
      <div class="card-header card-glow-border">
        <div class="card-title card-glow-border">Create New Semester</div>
        <div class="card-sub card-glow-border">Add a new academic term</div>
      </div>
      <div style="padding:1.5rem;display:flex;flex-direction:column;gap:1rem">
        <div class="form-group" style="margin-bottom:0">
          <label>Semester</label>
          <select [(ngModel)]="newSem.name">
            <option value="SPRING">🌸 Spring</option>
            <option value="SUMMER">☀️ Summer</option>
            <option value="FALL">🍂 Fall</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label>Year</label>
          <input type="number" [(ngModel)]="newSem.year" placeholder="2026" />
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label>Start Date</label>
          <input type="date" [(ngModel)]="newSem.startDate" />
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label>End Date</label>
          <input type="date" [(ngModel)]="newSem.endDate" />
        </div>
        <div class="form-group form-group--checkbox" style="margin-bottom:0">
          <label>
            <input type="checkbox" [(ngModel)]="newSem.makeActive" />
            Activate immediately (opens enrollment)
          </label>
        </div>
        <button class="btn-primary btn-neon" (click)="createSemester()" [disabled]="saving()" style="margin-top:0.25rem">
          <span *ngIf="!saving()">Create Semester</span>
          <span *ngIf="saving()" class="spinner-sm"></span>
        </button>
      </div>
    </div>

    <!-- Semester List -->
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
</div>
  `
})
export class SemesterManagementComponent implements OnInit {
  semesters = signal<SemesterResponse[]>([]);
  saving    = signal(false);
  success   = signal('');
  error     = signal('');
  newSem    = { name: 'SPRING', year: new Date().getFullYear(), startDate: '', endDate: '', makeActive: false };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getAllSemesters().subscribe({ next: s => this.semesters.set(s) });
  }

  createSemester(): void {
    this.saving.set(true); this.error.set(''); this.success.set('');
    this.api.createSemester(this.newSem).subscribe({
      next: (s) => {
        this.semesters.update(arr => [s, ...arr]);
        this.success.set(`Semester ${s.label} created successfully!`);
        this.saving.set(false);
      },
      error: (e) => { this.error.set(e.error?.detail || e.error?.message || 'Failed.'); this.saving.set(false); }
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
