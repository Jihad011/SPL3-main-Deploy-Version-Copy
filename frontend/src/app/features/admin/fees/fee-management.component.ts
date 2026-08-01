import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { FeeResponse } from '../../../core/models/models';

@Component({
  selector: 'app-fee-management',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <h1 class="page-title text-gradient-flow">Fee Management</h1>
      <p class="page-subtitle">View and manage student fee records</p>
    </div>
  </div>

  <div class="alert alert-success" *ngIf="success()">✅ {{ success() }}</div>
  <div class="alert alert-error"   *ngIf="error()">⚠️ {{ error() }}</div>

  <!-- Info Card -->
  <div class="card card-glow-border">
    <div class="card-header card-glow-border">
      <div class="card-title card-glow-border">Fee Management Hub</div>
    </div>
    <div style="padding:2rem;text-align:center">
      <div style="font-size:3rem;margin-bottom:1rem">💳</div>
      <p style="color:var(--text-secondary);margin-bottom:1.5rem;max-width:400px;margin-inline:auto;line-height:1.7">
        To view and manage fees for a specific student, go to
        <strong style="color:var(--text-primary)">Students → Select a student</strong>
        to access their fee records, create new fee entries, or mark fees as paid.
      </p>
      <a routerLink="../students" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.5rem;background:var(--grad-primary);color:#050816;font-weight:700;border-radius:8px;text-decoration:none;font-size:0.9rem">
        Go to Students →
      </a>
    </div>
  </div>
</div>
  `
})
export class FeeManagementComponent {
  loading = signal(false);
  success = signal('');
  error   = signal('');
}
