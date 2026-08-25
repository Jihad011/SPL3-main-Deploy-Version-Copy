import { Component, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { EnrollmentResponse, GradeResponse, SemesterResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToolbarComponent } from '../../../shared/components/toolbar/toolbar.component';
import { ToastService } from '../../../core/services/toast.service';

interface GradeRow extends EnrollmentResponse {
  midtermInput: number | null;
  finalInput:   number | null;
  existingGrade?: GradeResponse;
  saving: boolean;
  saved: boolean;
  dirty: boolean;
  isEditing: boolean;
}

function computeGradeLetter(total: number): string {
  if (total >= 80) return 'A+';
  if (total >= 75) return 'A';
  if (total >= 70) return 'A-';
  if (total >= 65) return 'B+';
  if (total >= 60) return 'B';
  if (total >= 55) return 'B-';
  if (total >= 50) return 'C+';
  if (total >= 45) return 'C';
  if (total >= 40) return 'D';
  return 'F';
}

@Component({
  selector: 'app-grade-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ToolbarComponent],
  template: `
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-eyebrow">Assessment workspace</div>
      <h1 class="page-title">Grade Entry</h1>
      <p class="page-subtitle" *ngIf="semester()">
        <app-icon name="calendar" [size]="14"></app-icon> {{ semester()!.label }}
      </p>
    </div>
    <div class="header-actions">
      <div class="metric-chip metric-chip--green" *ngIf="!loading() && rows().length > 0">
        <app-icon name="users" [size]="15"></app-icon>
        {{ gradedCount() }} / {{ rows().length }} graded
      </div>
      <button class="btn btn-secondary" *ngIf="!loading() && rows().length > 0" (click)="fillBlanksWithZero()" title="Fill all unentered marks with 0">
        <app-icon name="edit" [size]="14"></app-icon> Auto-Fill Blanks (0)
      </button>
      <button class="btn btn-secondary" *ngIf="!loading() && rows().length > 0" (click)="exportCsv()">
        <app-icon name="download" [size]="14"></app-icon> Export CSV
      </button>
      <button class="btn btn-secondary" *ngIf="!loading() && rows().length > 0" (click)="triggerCsvImport()">
        <app-icon name="upload" [size]="14"></app-icon> Upload CSV
      </button>
      <input type="file" accept=".csv" #csvInput style="display: none" (change)="importCsv($event)" />
      <button class="btn btn-primary" *ngIf="dirtyCount() > 0" (click)="saveAll()">
        <app-icon name="save" [size]="14"></app-icon> Save All ({{ dirtyCount() }})
      </button>
    </div>
  </div>

  <div class="alert alert-error" *ngIf="error()">
    <app-icon name="alert-triangle" [size]="16"></app-icon>{{ error() }}
  </div>
  <div class="spinner-wrapper" *ngIf="loading()"><div class="spinner"></div></div>

  <!-- Grade Distribution Summary Bar -->
  <div class="distribution-summary-card" *ngIf="!loading() && rows().length > 0">
    <span class="dist-label">Grade Distribution:</span>
    <div class="dist-chips">
      <span class="dist-chip grade-a">A+ / A ({{ distCounts().a }})</span>
      <span class="dist-chip grade-a-minus">A- ({{ distCounts().aMinus }})</span>
      <span class="dist-chip grade-b">B+ / B ({{ distCounts().b }})</span>
      <span class="dist-chip grade-c">C+ / C ({{ distCounts().c }})</span>
      <span class="dist-chip grade-f">F ({{ distCounts().f }})</span>
      <span class="dist-chip dist-pending">Pending ({{ distCounts().pending }})</span>
    </div>
  </div>

  <!-- Toolbar -->
  <app-toolbar
    *ngIf="!loading() && rows().length > 0"
    searchPlaceholder="Search by student name or roll…"
    [showViewToggle]="false"
    [resultCount]="filteredRows().length"
    (searchChange)="query.set($event)"
  />

  <!-- Grading progress bar -->
  <div class="grading-progress-bar" *ngIf="!loading() && rows().length > 0">
    <div class="grading-fill" [style.width.%]="gradedPercent()"></div>
  </div>

  <!-- Grade table card -->
  <div class="card" *ngIf="!loading() && filteredRows().length > 0">
    <div class="card-header">
      <div>
        <div class="card-title">Student Mark Sheet</div>
        <div class="card-sub">Midterm 0–40 · Final 0–60 · Total 100</div>
      </div>
      <div class="mark-legend">
        <span class="grade-badge grade-a">A</span>
        <span class="grade-badge grade-a-minus">A-</span>
        <span class="grade-badge grade-b">B+/B</span>
        <span class="grade-badge grade-c">C</span>
        <span class="grade-badge grade-f">F</span>
      </div>
    </div>
    <div class="table-wrapper">
      <table class="data-table grade-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Roll No.</th>
            <th>Student Name</th>
            <th>Midterm <small class="mark-denominator">(0–40)</small></th>
            <th>Final <small class="mark-denominator">(0–60)</small></th>
            <th>Total</th>
            <th>Preview</th>
            <th>Saved Grade</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of filteredRows(); let i = index"
              [class.row-saved]="row.saved"
              [class.row-invalid]="isInvalid(row)"
              [class.row-dirty]="row.dirty">
            <td class="text-muted">{{ i + 1 }}</td>
            <td><span class="code-badge">{{ row.rollNumber }}</span></td>
            <td>
              <div class="student-cell">
                <div class="student-mini-avatar">{{ row.studentName[0] }}</div>
                {{ row.studentName }}
              </div>
            </td>
            <td>
              <ng-container *ngIf="row.isEditing; else viewMidterm">
                <input type="number" class="mark-input" [(ngModel)]="row.midtermInput"
                       min="0" max="40" step="0.5" placeholder="—"
                       (ngModelChange)="onMarkChange(row)" />
              </ng-container>
              <ng-template #viewMidterm>
                <span class="numeric">{{ row.midtermInput !== null ? row.midtermInput : '—' }}</span>
              </ng-template>
            </td>
            <td>
              <ng-container *ngIf="row.isEditing; else viewFinal">
                <input type="number" class="mark-input" [(ngModel)]="row.finalInput"
                       min="0" max="60" step="0.5" placeholder="—"
                       (ngModelChange)="onMarkChange(row)" />
              </ng-container>
              <ng-template #viewFinal>
                <span class="numeric">{{ row.finalInput !== null ? row.finalInput : '—' }}</span>
              </ng-template>
            </td>
            <td>
              <strong *ngIf="row.midtermInput !== null && row.finalInput !== null" class="numeric"
                      [class.total-valid]="!isInvalid(row)"
                      [class.total-invalid]="isInvalid(row)">
                {{ (row.midtermInput || 0) + (row.finalInput || 0) }}
              </strong>
              <span *ngIf="row.midtermInput === null || row.finalInput === null" class="text-muted">—</span>
            </td>
            <!-- Live preview column -->
            <td>
              <span *ngIf="liveGrade(row) as lg"
                    class="grade-badge" [class]="gradeClass(lgLetter(row))"
                    title="Live preview">
                {{ lg }}
              </span>
              <span *ngIf="!liveGrade(row)" class="text-muted text-xs">—</span>
            </td>
            <!-- Saved grade -->
            <td>
              <span class="grade-badge" *ngIf="row.existingGrade?.gradeDisplay"
                    [class]="gradeClass(row.existingGrade?.gradeLetter ?? null)">
                {{ row.existingGrade!.gradeDisplay }}
              </span>
              <span *ngIf="!row.existingGrade?.gradeDisplay" class="text-muted">Pending</span>
            </td>
            <td>
              <div class="row-actions">
                <button *ngIf="row.isEditing" class="btn-action btn-save-action" (click)="saveRow(row)" [disabled]="row.saving || isInvalid(row)" title="Save Grade">
                  <span *ngIf="!row.saving && !row.saved" class="action-label"><app-icon name="save" [size]="14"></app-icon> Save</span>
                  <span *ngIf="row.saving" class="spinner-sm"></span>
                  <span *ngIf="row.saved && !row.saving" class="action-label saved"><app-icon name="check-circle" [size]="14"></app-icon> Saved</span>
                </button>
                <button *ngIf="!row.isEditing" class="btn-action btn-edit-action" (click)="editRow(row)" title="Edit Grade">
                  <app-icon name="edit" [size]="14"></app-icon> Edit
                </button>
                <button class="btn-action btn-view-action" (click)="viewStudent(row)" title="View Details">
                  <app-icon name="eye" [size]="14"></app-icon> View
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="empty-state" *ngIf="!loading() && rows().length > 0 && filteredRows().length === 0">
    <div class="empty-icon"><app-icon name="search" [size]="28"></app-icon></div>
    <h3>No matching students</h3>
    <p>Try a different name or roll number.</p>
  </div>

  <div class="empty-state" *ngIf="!loading() && rows().length === 0">
    <div class="empty-icon"><app-icon name="users" [size]="28"></app-icon></div>
    <h3>No students enrolled in this course</h3>
    <p>Students haven't registered for this course yet.</p>
  </div>
</div>

<!-- Student Details Modal Overlay -->
<div class="modal-overlay" *ngIf="selectedStudent" (click)="closeViewModal()">
  <div class="modal-card" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <div class="modal-title-group">
        <div class="student-mini-avatar large">{{ selectedStudent.studentName[0] }}</div>
        <div>
          <h3>{{ selectedStudent.studentName }}</h3>
          <span class="code-badge">{{ selectedStudent.rollNumber }}</span>
        </div>
      </div>
      <button class="btn-icon" (click)="closeViewModal()">
        <app-icon name="x" [size]="20"></app-icon>
      </button>
    </div>
    
    <div class="modal-body">
      <div class="stat-grid">
        <div class="stat-box">
          <label>Midterm (0–40)</label>
          <div class="stat-value numeric">{{ selectedStudent.midtermInput !== null ? selectedStudent.midtermInput : '—' }}</div>
        </div>
        <div class="stat-box">
          <label>Final (0–60)</label>
          <div class="stat-value numeric">{{ selectedStudent.finalInput !== null ? selectedStudent.finalInput : '—' }}</div>
        </div>
        <div class="stat-box highlight">
          <label>Total Score</label>
          <div class="stat-value numeric">
            {{ selectedStudent.midtermInput !== null && selectedStudent.finalInput !== null ? (selectedStudent.midtermInput + selectedStudent.finalInput) : '—' }}
          </div>
        </div>
        <div class="stat-box grade">
          <label>Letter Grade</label>
          <div class="stat-value">
            <span *ngIf="selectedStudent.existingGrade?.gradeDisplay" class="grade-badge" [class]="gradeClass(selectedStudent.existingGrade?.gradeLetter ?? null)">
              {{ selectedStudent.existingGrade?.gradeDisplay }}
            </span>
            <span *ngIf="!selectedStudent.existingGrade?.gradeDisplay" class="text-muted">Pending</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="modal-footer">
      <button class="btn btn-primary" (click)="closeViewModal()">Close Record</button>
    </div>
  </div>
</div>
  `,
  styles: [`
    .header-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    
    .distribution-summary-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg, 14px);
      padding: 1.15rem 1.65rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      flex-wrap: wrap;
      box-shadow: var(--shadow-sm);
    }
    .dist-label {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .dist-chips {
      display: flex;
      gap: 0.65rem;
      flex-wrap: wrap;
    }
    .dist-chip {
      padding: 0.35rem 0.8rem;
      border-radius: 9999px;
      font-size: 0.82rem;
      font-weight: 700;
    }
    .dist-pending {
      background: rgba(100, 116, 139, 0.1);
      color: var(--text-muted);
      border: 1px solid var(--border);
    }

    .grading-progress-bar {
      height: 5px; background: var(--border); border-radius: 4px;
      overflow: hidden; margin-bottom: 1.25rem;
    }
    .grading-fill {
      height: 100%; background: var(--grad-green);
      transition: width .8s cubic-bezier(0.4,0,0.2,1); border-radius: 4px;
    }
    .btn-save {
      background: var(--bg-elevated); color: var(--text-primary); border: 1px solid var(--border);
      border-radius: var(--radius-sm); padding: 0.45rem 0.85rem; font-size: 0.85rem; font-weight: 600;
      display: inline-flex; align-items: center; justify-content: center; min-width: 80px;
      cursor: pointer; transition: all 0.2s;
    }
    .row-actions {
      display: flex; gap: 0.5rem; align-items: center; min-width: 130px;
    }
    .btn-action {
      background: transparent; border: 1px solid var(--border); border-radius: var(--radius-sm);
      padding: 0.45rem 0.75rem; font-size: 0.82rem; font-weight: 600; cursor: pointer;
      display: inline-flex; align-items: center; gap: 0.4rem; transition: all 0.2s;
      color: var(--text-secondary);
    }
    .btn-action:hover {
      background: var(--bg-elevated); color: var(--text-primary); border-color: var(--text-muted);
    }
    .btn-save-action {
      background: rgba(16, 185, 129, 0.1); color: var(--accent-green); border-color: rgba(16, 185, 129, 0.2);
    }
    .btn-save-action:hover:not(:disabled) {
      background: var(--accent-green); color: white; border-color: var(--accent-green);
    }
    .btn-save-action:disabled { opacity: 0.5; cursor: not-allowed; }
    .action-label.saved { color: var(--accent-green); }
    .btn-save-action:disabled .action-label.saved { color: inherit; }
    .numeric { font-family: 'Inter', monospace; font-feature-settings: "tnum"; letter-spacing: -0.5px; }
    .mark-legend { display: flex; gap: 0.375rem; align-items: center; }
    .total-valid  { color: var(--accent-green); }
    .total-invalid { color: var(--accent-red); }
    .text-muted { color: var(--text-muted); }
    .text-xs { font-size: 0.72rem; }
    
    /* Modal Styles */
    .modal-title-group { display: flex; align-items: center; gap: 1.25rem; }
    .modal-title-group h3 { margin: 0 0 0.3rem 0; font-size: 1.3rem; color: var(--text-primary); font-weight: 700; letter-spacing: -0.02em; }
    .student-mini-avatar.large { width: 56px; height: 56px; font-size: 1.4rem; color: #FFFFFF; background: var(--grad-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); }
    
    .btn-icon {
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      cursor: pointer;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    .btn-icon:hover { background: rgba(220, 38, 38, 0.1); border-color: rgba(220, 38, 38, 0.3); color: var(--accent-red); }

    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .stat-box { 
      background: var(--bg-surface); padding: 1.25rem; border-radius: var(--radius); 
      border: 1px solid var(--border); display: flex; flex-direction: column; gap: 0.5rem;
      transition: all 0.2s ease; position: relative; overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .stat-box:hover {
      border-color: var(--cyan); transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }
    .stat-box label { font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
    .stat-box .stat-value { font-size: 1.85rem; font-weight: 800; color: var(--text-primary); }
    
    .stat-box.highlight { background: rgba(37, 99, 235, 0.06); border-color: rgba(37, 99, 235, 0.25); }
    .stat-box.highlight:hover { background: rgba(37, 99, 235, 0.1); box-shadow: 0 8px 24px -8px rgba(37, 99, 235, 0.25); }
    .stat-box.highlight label { color: var(--cyan); font-weight: 800; }
    .stat-box.highlight .stat-value { color: var(--cyan); }
    
    .modal-footer { margin-top: 2rem; display: flex; justify-content: flex-end; }
    .modal-footer .btn-primary { border-radius: var(--radius-sm); padding: 0.75rem 1.5rem; font-weight: 700; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
  `]
})
export class GradeEntryComponent implements OnInit {
  rows       = signal<GradeRow[]>([]);
  semester   = signal<SemesterResponse | null>(null);
  loading    = signal(true);
  readonly error = signal('');
  selectedStudent: GradeRow | null = null;
  query      = signal('');
  courseId!: number;

  filteredRows = computed(() => {
    const q = this.query().trim().toLowerCase();
    return !q ? this.rows() : this.rows().filter(row =>
      row.studentName.toLowerCase().includes(q) ||
      (row.rollNumber ?? '').toLowerCase().includes(q)
    );
  });

  gradedCount  = computed(() => this.rows().filter(r => !!r.existingGrade?.gradeDisplay).length);
  gradedPercent = computed(() =>
    this.rows().length > 0 ? (this.gradedCount() / this.rows().length) * 100 : 0
  );
  dirtyCount = computed(() => this.rows().filter(r => r.dirty).length);

  distCounts = computed(() => {
    let a = 0, aMinus = 0, b = 0, c = 0, f = 0, pending = 0;
    for (const r of this.rows()) {
      const letter = r.existingGrade?.gradeLetter;
      if (!letter) {
        pending++;
      } else if (letter === 'A_PLUS' || letter === 'A') {
        a++;
      } else if (letter === 'A_MINUS') {
        aMinus++;
      } else if (letter.startsWith('B')) {
        b++;
      } else if (letter.startsWith('C') || letter === 'D') {
        c++;
      } else if (letter === 'F') {
        f++;
      } else {
        pending++;
      }
    }
    return { a, aMinus, b, c, f, pending };
  });

  fillBlanksWithZero(): void {
    let filled = 0;
    this.rows.update(rows => rows.map(r => {
      let changed = false;
      let mid = r.midtermInput;
      let fin = r.finalInput;
      if (mid === null) { mid = 0; changed = true; }
      if (fin === null) { fin = 0; changed = true; }
      if (changed) {
        filled++;
        return { ...r, midtermInput: mid, finalInput: fin, dirty: true, isEditing: true };
      }
      return r;
    }));
    if (filled > 0) {
      this.toast.info(`Filled blanks with 0 for ${filled} student(s). Click 'Save All' to commit.`);
    } else {
      this.toast.info('No empty mark entries found.');
    }
  }

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.courseId = +params['courseId'];
      if (!this.courseId) { this.error.set('No course selected.'); return; }
      this.loadData();
    });
  }

  loadData(): void {
    this.api.getActiveSemesters().subscribe({
      next: (sems) => {
        if (sems.length === 0) { this.error.set('No active semesters found.'); this.loading.set(false); return; }
        const sem = sems[0];
        this.semester.set(sem);
        this.api.getEnrolledStudents(this.courseId, sem.id).subscribe({
          next: (enrollments) => {
            this.api.getCourseGrades(this.courseId, sem.id).subscribe({
              next: (grades) => {
                const gradeMap = new Map(grades.map(g => [g.enrollmentId, g]));
                this.rows.set(enrollments.map(e => {
                  const existing = gradeMap.get(e.id);
                  return {
                    ...e,
                    midtermInput: existing?.midtermMarks ?? null,
                    finalInput:   existing?.finalMarks   ?? null,
                    existingGrade: existing,
                    saving: false, saved: false, dirty: false,
                    isEditing: false
                  };
                }));
                this.loading.set(false);
              }
            });
          }
        });
      },
      error: () => { this.error.set('Could not load active semesters.'); this.loading.set(false); }
    });
  }

  onMarkChange(row: GradeRow): void { row.dirty = true; }

  editRow(row: GradeRow): void {
    row.isEditing = true;
  }

  viewStudent(row: GradeRow): void {
    this.selectedStudent = row;
  }
  
  closeViewModal(): void {
    this.selectedStudent = null;
  }

  saveRow(row: GradeRow): void {
    if (this.isInvalid(row)) {
      this.toast.error('Midterm 0–40 and Final 0–60 only.');
      return;
    }
    this.error.set('');
    row.saving = true;
    row.saved  = false;
    this.api.enterGrade({
      enrollmentId: row.id,
      midtermMarks: row.midtermInput ?? undefined,
      finalMarks:   row.finalInput   ?? undefined
    }).subscribe({
      next: (g) => {
        row.saving = false;
        row.saved  = true;
        row.dirty  = false;
        row.isEditing = false;
        row.existingGrade = g;
        this.rows.update(r => [...r]);
        this.toast.success(`Grade saved for ${row.studentName}`);
        setTimeout(() => { row.saved = false; this.rows.update(r => [...r]); }, 3000);
      },
      error: (e) => {
        row.saving = false;
        const msg = e.error?.detail || e.error?.message || 'Failed to save grade.';
        this.toast.error(msg);
      }
    });
  }

  saveAll(): void {
    const dirty = this.rows().filter(r => r.dirty && !this.isInvalid(r));
    if (dirty.length === 0) {
      this.toast.info('No valid changes to save.');
      return;
    }

    this.error.set('');
    dirty.forEach(r => { r.saving = true; r.saved = false; });

    const requests = dirty.map(r => ({
      enrollmentId: r.id,
      midtermMarks: r.midtermInput ?? undefined,
      finalMarks:   r.finalInput   ?? undefined
    }));

    this.api.bulkEnterGrades(this.courseId, requests).subscribe({
      next: (grades) => {
        const gradeMap = new Map(grades.map(g => [g.enrollmentId, g]));
        dirty.forEach(r => {
          r.existingGrade = gradeMap.get(r.id);
          r.saving = false;
          r.saved = true;
          r.isEditing = false;
          r.dirty = false;
        });
        this.rows.update(r => [...r]);
        this.toast.success(`Successfully saved marks for ${dirty.length} students.`);
        setTimeout(() => {
          dirty.forEach(r => r.saved = false);
          this.rows.update(r => [...r]);
        }, 3000);
      },
      error: (e) => {
        dirty.forEach(r => r.saving = false);
        const msg = e.error?.detail || e.error?.message || 'Failed to save marks.';
        this.toast.error(msg);
      }
    });
  }

  isInvalid(row: GradeRow): boolean {
    return (row.midtermInput !== null && (row.midtermInput < 0 || row.midtermInput > 40)) ||
           (row.finalInput   !== null && (row.finalInput   < 0 || row.finalInput   > 60));
  }

  liveGrade(row: GradeRow): string | null {
    if (row.midtermInput === null || row.finalInput === null) return null;
    if (this.isInvalid(row)) return null;
    const total = (row.midtermInput || 0) + (row.finalInput || 0);
    return computeGradeLetter(total);
  }

  lgLetter(row: GradeRow): string | null {
    const g = this.liveGrade(row);
    if (!g) return null;
    if (g === 'A+') return 'A_PLUS';
    if (g === 'A') return 'A';
    if (g.startsWith('A')) return 'A_MINUS';
    if (g.startsWith('B')) return 'B_PLUS';
    if (g.startsWith('C')) return 'C';
    if (g === 'D') return 'D';
    return 'F';
  }

  gradeClass(letter: string | null): string {
    if (!letter) return '';
    if (letter === 'A_PLUS')     return 'grade-a';
    if (letter === 'A')          return 'grade-a';
    if (letter.startsWith('A'))  return 'grade-a-minus';
    if (letter.startsWith('B'))  return 'grade-b';
    if (letter.startsWith('C'))  return 'grade-c';
    if (letter === 'D')          return 'grade-d';
    return 'grade-f';
  }

  exportCsv(): void {
    const rows = this.rows();
    if (!rows.length) return;
    const semLabel = this.semester()?.label ?? '';
    const headers = ['#', 'Roll No.', 'Student Name', 'Midterm (0-40)', 'Final (0-60)', 'Total', 'Grade'];
    const lines = rows.map((r, i) => [
      i + 1,
      r.rollNumber ?? '',
      `"${r.studentName}"`,
      r.existingGrade?.midtermMarks ?? '',
      r.existingGrade?.finalMarks   ?? '',
      r.existingGrade?.totalMarks   ?? '',
      r.existingGrade?.gradeDisplay ?? 'Pending'
    ].join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grades_course${this.courseId}_${semLabel.replace(/\s/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.toast.success('CSV exported successfully!');
  }

  @ViewChild('csvInput') csvInput!: ElementRef<HTMLInputElement>;

  triggerCsvImport(): void {
    if (this.csvInput) {
      this.csvInput.nativeElement.click();
    } else {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.click();
    }
  }

  importCsv(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.loading.set(true);

    this.api.uploadGradesCsv(this.courseId, file).subscribe({
      next: (responses) => {
        this.loading.set(false);
        this.toast.success(`Successfully processed ${responses.length} grades from CSV! 🎉`);
        this.loadData();
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.detail || err.error?.message || 'Failed to upload CSV grades';
        this.error.set(msg);
        this.toast.error(msg);
      }
    });
    
    // reset input so the same file can be re-selected if edited
    input.value = '';
  }
}
