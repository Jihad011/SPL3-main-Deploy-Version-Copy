import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { UserResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToolbarComponent } from '../../../shared/components/toolbar/toolbar.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-teacher-management',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ToolbarComponent],
  template: `
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-eyebrow">Directory administration</div>
      <h1 class="page-title">Faculty Management</h1>
      <p class="page-subtitle">View and add faculty accounts</p>
    </div>
    <button class="btn btn-primary" (click)="showAddModal.set(true)">
      <app-icon name="user" [size]="15"></app-icon>Add Faculty
    </button>
  </div>

  <div class="spinner-wrapper" *ngIf="loading()"><div class="spinner"></div></div>

  <!-- Universal Toolbar -->
  <app-toolbar
    *ngIf="!loading() && teachers().length > 0"
    searchPlaceholder="Search faculty by name or email..."
    [showViewToggle]="false"
    [resultCount]="filteredTeachers().length"
    (searchChange)="query.set($event)"
  />

  <div class="card" *ngIf="!loading()">
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Faculty Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Account Status</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of filteredTeachers()">
            <td>
              <div class="table-cell-user">
                <div class="user-avatar" [style.background]="avatarGradient(t.name)">
                  {{ t.name.charAt(0).toUpperCase() }}
                </div>
                <strong>{{ t.name }}</strong>
              </div>
            </td>
            <td><span class="text-muted">{{ t.email }}</span></td>
            <td><span class="badge badge-teacher">FACULTY</span></td>
            <td>
              <span class="status-badge" [class.status-active]="t.isActive" [class.status-inactive]="!t.isActive">
                <span class="badge-dot" *ngIf="t.isActive"></span>
                {{ t.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
          </tr>
          <tr *ngIf="filteredTeachers().length === 0">
            <td colspan="4" class="text-center text-muted py-8">No matching faculty members found.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Add Modal -->
<div class="modal-overlay" *ngIf="showAddModal()" (click)="showAddModal.set(false)">
  <div class="modal-card" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <h2>Add New Faculty</h2>
      <button class="btn-icon" (click)="showAddModal.set(false)"><app-icon name="x" [size]="20"></app-icon></button>
    </div>
    <div class="modal-body">
      <div class="alert alert-error" *ngIf="error()">{{ error() }}</div>
      <div class="form-group">
        <label>Full Name</label>
        <input [(ngModel)]="newTeacher.name" placeholder="Dr. John Doe" />
      </div>
      <div class="form-group">
        <label>Email Address</label>
        <input [(ngModel)]="newTeacher.email" type="email" placeholder="john.doe@university.edu" />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input [(ngModel)]="newTeacher.password" type="password" placeholder="••••••••" />
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" (click)="showAddModal.set(false)" [disabled]="saving()">Cancel</button>
      <button class="btn btn-primary" (click)="saveTeacher()" [disabled]="saving()">
        <span *ngIf="!saving()">Create Faculty</span>
        <span *ngIf="saving()">Creating...</span>
      </button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .table-cell-user {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
    }
    .badge-teacher {
      background: rgba(147, 51, 234, 0.15);
      color: #c084fc;
      border: 1px solid rgba(147, 51, 234, 0.3);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
  `]
})
export class TeacherManagementComponent implements OnInit {
  teachers = signal<UserResponse[]>([]);
  loading = signal(true);
  query = signal('');
  
  showAddModal = signal(false);
  saving = signal(false);
  error = signal('');
  
  newTeacher = { name: '', email: '', password: '', role: 'TEACHER' };

  filteredTeachers = computed(() => {
    const q = this.query().trim().toLowerCase();
    return !q ? this.teachers() : this.teachers().filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q)
    );
  });

  constructor(private api: ApiService, private toast: ToastService) {}

  ngOnInit() {
    this.loadTeachers();
  }

  loadTeachers() {
    this.loading.set(true);
    this.api.getAllTeachers(0, 100).subscribe({
      next: (res) => {
        this.teachers.set(res.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  saveTeacher() {
    if (!this.newTeacher.name || !this.newTeacher.email || !this.newTeacher.password) {
      this.error.set('All fields are required');
      return;
    }
    
    this.saving.set(true);
    this.error.set('');
    
    this.api.createTeacher(this.newTeacher).subscribe({
      next: (res) => {
        this.toast.success('Faculty member created successfully');
        this.showAddModal.set(false);
        this.saving.set(false);
        this.newTeacher = { name: '', email: '', password: '', role: 'TEACHER' };
        this.loadTeachers();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to create faculty member');
        this.saving.set(false);
      }
    });
  }

  avatarGradient(name: string): string {
    const char = name ? name.charAt(0).toUpperCase() : 'A';
    const charCode = char.charCodeAt(0);
    if (charCode < 70) return 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
    if (charCode < 77) return 'linear-gradient(135deg, #10b981, #3b82f6)';
    if (charCode < 84) return 'linear-gradient(135deg, #f59e0b, #ef4444)';
    return 'linear-gradient(135deg, #ec4899, #8b5cf6)';
  }
}
