import { Component, OnInit, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { EnrollmentResponse, GradeResponse, SemesterResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToolbarComponent } from '../../../shared/components/toolbar/toolbar.component';
import { ToastService } from '../../../core/services/toast.service';

// CenterPoint Shared Components
import {
  GenericModal,
  GenericButton,
  ConfirmationDialogue
} from '../../../shared';

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
  imports: [
    CommonModule,
    FormsModule,
    IconComponent,
    ToolbarComponent,
    GenericModal,
    GenericButton,
    ConfirmationDialogue
  ],
  template: `
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-eyebrow">Assessment workspace</div>
      <h1 class="page-title">Grade Entry</h1>
      <p class="page-subtitle" *ngIf="semester()">
        <app-icon name="calendar" [size]="14"></app-icon> {{ semester()!.label }} · Live Assessment Matrix
      </p>
    </div>
    <div class="header-actions">
      <div class="metric-chip metric-chip--green font-mono" *ngIf="!loading() && rows().length > 0">
        <app-icon name="users" [size]="15"></app-icon>
        {{ gradedCount() }} / {{ rows().length }} graded
      </div>
      <generic-button
        *ngIf="!loading() && rows().length > 0"
        label="Auto-Fill Blanks (0)"
        icon="edit"
        styles="background: var(--bg-elevated); color: var(--text-primary); border: 1px solid var(--border);"
        (onClick)="fillBlanksWithZero()"
      />
      <generic-button
        *ngIf="!loading() && rows().length > 0"
        label="Export CSV"
        icon="download"
        styles="background: var(--bg-elevated); color: var(--text-primary); border: 1px solid var(--border);"
        (onClick)="exportCsv()"
      />
      <generic-button
        *ngIf="!loading() && rows().length > 0"
        label="Upload CSV"
        icon="upload"
        styles="background: var(--bg-elevated); color: var(--text-primary); border: 1px solid var(--border);"
        (onClick)="triggerCsvImport()"
      />
      <input type="file" accept=".csv" #csvInput style="display: none" (change)="importCsv($event)" />

      <generic-button
        *ngIf="dirtyCount() > 0"
        [label]="'Save All (' + dirtyCount() + ')'"
        icon="save"
        styles="background: linear-gradient(135deg, #086AD8, #2563eb); color: #ffffff;"
        (onClick)="showSaveConfirm.set(true)"
      />
    </div>
  </div>

  <div class="alert alert-error" *ngIf="error()">
    <app-icon name="alert-triangle" [size]="16"></app-icon>{{ error() }}
  </div>

  <!-- Top Academic Term Selectors: Semester Name & Semester Type -->
  <div class="top-selector-bar" *ngIf="!loading()">
    <div class="selector-card">
      <label class="selector-label">
        <app-icon name="book-open" [size]="15" /> Semester Name
      </label>
      <select class="selector-dropdown font-mono" [ngModel]="selectedSemesterLevel()" (ngModelChange)="selectedSemesterLevel.set(+$event)">
        <option [value]="1">1st Semester</option>
        <option [value]="2">2nd Semester</option>
        <option [value]="3">3rd Semester</option>
      </select>
    </div>

    <div class="selector-card">
      <label class="selector-label">
        <app-icon name="calendar" [size]="15" /> Semester Type
      </label>
      <select class="selector-dropdown font-mono" [ngModel]="selectedSemesterType()" (ngModelChange)="selectedSemesterType.set($event)">
        <option value="Spring">Spring Intake</option>
        <option value="Fall">Fall Intake</option>
      </select>
    </div>
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

  <!-- Universal Toolbar -->
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
            <td class="text-muted font-mono">{{ i + 1 }}</td>
            <td><span class="code-badge font-mono">{{ row.rollNumber }}</span></td>
            <td>
              <div class="student-cell">
                <div class="student-mini-avatar">{{ row.studentName[0] }}</div>
                <strong>{{ row.studentName }}</strong>
              </div>
            </td>
            <td>
              <ng-container *ngIf="row.isEditing; else viewMidterm">
                <input type="number" class="mark-input font-mono" [(ngModel)]="row.midtermInput"
                       min="0" max="40" step="0.5" placeholder="—"
                       (ngModelChange)="onMarkChange(row)" />
              </ng-container>
              <ng-template #viewMidterm>
                <span class="numeric font-mono">{{ row.midtermInput !== null ? row.midtermInput : '—' }}</span>
              </ng-template>
            </td>
            <td>
              <ng-container *ngIf="row.isEditing; else viewFinal">
                <input type="number" class="mark-input font-mono" [(ngModel)]="row.finalInput"
                       min="0" max="60" step="0.5" placeholder="—"
                       (ngModelChange)="onMarkChange(row)" />
              </ng-container>
              <ng-template #viewFinal>
                <span class="numeric font-mono">{{ row.finalInput !== null ? row.finalInput : '—' }}</span>
              </ng-template>
            </td>
            <td>
              <strong *ngIf="row.midtermInput !== null && row.finalInput !== null" class="numeric font-mono"
                      [class.total-valid]="!isInvalid(row)"
                      [class.total-invalid]="isInvalid(row)">
                {{ (row.midtermInput || 0) + (row.finalInput || 0) }}
              </strong>
              <span *ngIf="row.midtermInput === null || row.finalInput === null" class="text-muted">—</span>
            </td>
            <!-- Live preview column -->
            <td>
              <span *ngIf="liveGrade(row) as lg"
                    class="grade-badge font-mono font-bold" [class]="gradeClass(lgLetter(row))"
                    title="Live preview">
                {{ lg }}
              </span>
              <span *ngIf="!liveGrade(row)" class="text-muted text-xs">—</span>
            </td>
            <!-- Saved grade -->
            <td>
              <span class="grade-badge font-mono" *ngIf="row.existingGrade?.gradeDisplay"
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

  <!-- CenterPoint Generic Modal for Student Details -->
  <generic-modal
    [isVisible]="selectedStudent !== null"
    modalTitle="Student Assessment Dossier"
    (isVisibleChanged)="ifFalseCloseStudent($event)"
    (modalClosed)="closeViewModal()"
    [showDefaultFooter]="false"
  >
    <div class="modal-body-content" *ngIf="selectedStudent">
      <div class="student-header-box">
        <div class="student-mini-avatar large">{{ selectedStudent.studentName[0] }}</div>
        <div>
          <h3 style="margin: 0; font-size: 1.15rem;">{{ selectedStudent.studentName }}</h3>
          <span class="code-badge font-mono" style="margin-top: 0.25rem; display: inline-block;">Roll: {{ selectedStudent.rollNumber }}</span>
        </div>
      </div>

      <div class="stat-grid" style="margin-top: 1.25rem;">
        <div class="stat-box">
          <label>Midterm (0–40)</label>
          <div class="stat-value numeric font-mono">{{ selectedStudent.midtermInput !== null ? selectedStudent.midtermInput : '—' }}</div>
        </div>
        <div class="stat-box">
          <label>Final (0–60)</label>
          <div class="stat-value numeric font-mono">{{ selectedStudent.finalInput !== null ? selectedStudent.finalInput : '—' }}</div>
        </div>
        <div class="stat-box highlight">
          <label>Total Score</label>
          <div class="stat-value numeric font-mono">
            {{ (selectedStudent.midtermInput !== null && selectedStudent.finalInput !== null) ? ((selectedStudent.midtermInput || 0) + (selectedStudent.finalInput || 0)) : '—' }}
          </div>
        </div>
        <div class="stat-box highlight">
          <label>Letter Grade</label>
          <div class="stat-value font-mono">
            {{ selectedStudent.existingGrade?.gradeDisplay || liveGrade(selectedStudent) || 'Pending' }}
          </div>
        </div>
      </div>

      <div class="modal-action-footer">
        <generic-button
          label="Close"
          (onClick)="closeViewModal()"
        />
      </div>
    </div>
  </generic-modal>

  <!-- Confirmation Dialogue for Save All -->
  <confirmation-dialogue
    [isOpen]="showSaveConfirm()"
    title="Commit Batch Grades"
    [message]="'Are you sure you want to save marks for ' + dirtyCount() + ' student(s)?'"
    variant="primary"
    (close)="showSaveConfirm.set(false)"
    (buttonClick)="confirmSaveAll($event)"
  />

</div>
  `,
  styles: [`
    .top-selector-bar {
      display: flex;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .selector-card {
      flex: 1;
      min-width: 240px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 0.85rem 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      box-shadow: var(--shadow-sm);
    }
    .selector-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--accent-primary, #2563eb);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .selector-dropdown {
      padding: 0.55rem 0.85rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--bg-elevated);
      color: var(--text-primary);
      font-size: 0.95rem;
      font-weight: 600;
      outline: none;
      cursor: pointer;
    }
    .selector-dropdown:focus {
      border-color: var(--accent-primary);
    }
    .metric-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      background: rgba(16, 185, 129, 0.12);
      color: var(--accent-green, #10b981);
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .distribution-summary-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 0.85rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .dist-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .dist-chips {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .dist-chip {
      padding: 0.25rem 0.65rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      font-family: monospace;
    }
    .dist-pending { background: var(--bg-elevated); color: var(--text-muted); border: 1px solid var(--border); }
    .grading-progress-bar {
      height: 6px;
      background: var(--bg-elevated);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 1.25rem;
    }
    .grading-fill {
      height: 100%;
      background: var(--grad-cyan);
      transition: width 0.3s ease;
    }
    .grade-table th { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .mark-input {
      width: 65px;
      padding: 0.35rem 0.5rem;
      border-radius: 6px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      color: var(--text-primary);
      text-align: center;
    }
    .mark-input:focus { outline: none; border-color: var(--accent-primary); }
    .mark-denominator { color: var(--text-muted); font-size: 0.72rem; }
    .student-cell {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .student-mini-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #086AD8, #2563eb);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 12px;
    }
    .student-mini-avatar.large {
      width: 44px;
      height: 44px;
      font-size: 18px;
    }
    .student-header-box {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 1rem;
    }
    .stat-box {
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.85rem;
      text-align: center;
    }
    .stat-box.highlight {
      border-color: var(--accent-primary);
      background: rgba(34, 211, 238, 0.05);
    }
    .stat-box label {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: block;
      margin-bottom: 0.25rem;
    }
    .stat-box .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .modal-action-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
    }
    .row-actions {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn-action {
      padding: 0.3rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      border: 1px solid var(--border);
      background: var(--bg-elevated);
      color: var(--text-primary);
      transition: all 0.2s;
    }
    .btn-action:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
    .btn-save-action {
      background: linear-gradient(135deg, #086AD8, #2563eb) !important;
      color: #ffffff !important;
      border: none !important;
      box-shadow: 0 2px 6px rgba(8, 106, 216, 0.35);
    }
    .btn-save-action:hover:not(:disabled) {
      background: linear-gradient(135deg, #0456b8, #1d4ed8) !important;
      color: #ffffff !important;
    }
    .grade-badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .grade-a { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .grade-a-minus { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .grade-b { background: rgba(168, 85, 247, 0.15); color: #a855f7; }
    .grade-c { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .grade-f { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
  `]
})
export class GradeEntryComponent implements OnInit {
  selectedSemesterLevel = signal<number>(1);
  selectedSemesterType = signal<'Spring' | 'Fall'>('Spring');

  rows = signal<GradeRow[]>([]);
  semester = signal<SemesterResponse | null>(null);
  loading = signal(true);
  readonly error = signal('');
  selectedStudent: GradeRow | null = null;
  query = signal('');
  courseId!: number;
  showSaveConfirm = signal(false);
  activeCourseCode = signal<string>('');
  activeCourseName = signal<string>('');

  filteredRows = computed(() => {
    const q = this.query().trim().toLowerCase();
    return !q ? this.rows() : this.rows().filter(row =>
      row.studentName.toLowerCase().includes(q) ||
      (row.rollNumber ?? '').toLowerCase().includes(q)
    );
  });

  gradedCount = computed(() => this.rows().filter(r => !!r.existingGrade?.gradeDisplay).length);
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
            if (enrollments.length > 0) {
              this.activeCourseCode.set(enrollments[0].courseCode || '');
              this.activeCourseName.set(enrollments[0].courseName || '');
            }
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

  ifFalseCloseStudent(isOpen: boolean): void {
    if (!isOpen) this.selectedStudent = null;
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

  confirmSaveAll(event?: any): void {
    this.showSaveConfirm.set(false);
    if (!event || event.action === 'confirm' || event.action === 'save') {
      this.saveAll();
    }
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
    this.error.set(''); // Clear previous error banner
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          const courseColIdx = headers.findIndex(h => /^(course\s*code|coursecode|course|subject)$/i.test(h));

          if (courseColIdx === -1) {
            const activeCode = this.activeCourseCode();
            const msg = `Missing Course Code Column: The uploaded CSV file does not contain a 'Course Code' header. All mark sheets must include a 'Course Code' column (e.g. ${activeCode || 'MITM 303'}).`;
            this.error.set(msg);
            this.toast.error(msg);
            setTimeout(() => this.error.set(''), 5000);
            input.value = '';
            return;
          }

          if (lines.length > 1) {
            const firstDataRow = lines[1].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            const fileCourseCode = firstDataRow[courseColIdx];
            const activeCode = this.activeCourseCode();

            if (!fileCourseCode || (activeCode && fileCourseCode.trim().toLowerCase() !== activeCode.trim().toLowerCase())) {
              const msg = `Course Mismatch Warning: The uploaded CSV file is for '${(fileCourseCode || 'Unknown').trim()}', but you are currently grading '${activeCode}' (${this.activeCourseName()}). Import cancelled!`;
              this.error.set(msg);
              this.toast.error(msg);
              setTimeout(() => this.error.set(''), 5000);
              input.value = '';
              return;
            }

            // Check if any mark in the CSV actually differs from current rows
            let changedCount = 0;
            const currentMap = new Map(this.rows().map(r => [(r.rollNumber || '').toLowerCase().trim(), r]));
            const rollColIdx = headers.findIndex(h => /^(roll\s*number|roll\s*no\.?|roll|student\s*roll|rollnumber)$/i.test(h));
            const midColIdx = headers.findIndex(h => /^(midterm|mid|midterm\s*marks)$/i.test(h));
            const finColIdx = headers.findIndex(h => /^(final|finals|final\s*marks)$/i.test(h));

            if (rollColIdx !== -1) {
              for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                const roll = cols[rollColIdx]?.toLowerCase().trim();
                if (!roll) continue;

                const existing = currentMap.get(roll);
                if (existing) {
                  const csvMid = midColIdx !== -1 && cols[midColIdx] ? parseFloat(cols[midColIdx]) : null;
                  const csvFin = finColIdx !== -1 && cols[finColIdx] ? parseFloat(cols[finColIdx]) : null;

                  const oldMid = existing.midtermInput;
                  const oldFin = existing.finalInput;

                  const midDiff = (csvMid !== null && !isNaN(csvMid) && csvMid !== oldMid);
                  const finDiff = (csvFin !== null && !isNaN(csvFin) && csvFin !== oldFin);

                  if (midDiff || finDiff) {
                    changedCount++;
                  }
                }
              }

              if (changedCount === 0) {
                const msg = 'No Change Detected.';
                this.toast.info(msg);
                input.value = '';
                return;
              }
            }
          }
        }
      }

      this.processCsvUpload(file, input);
    };
    reader.readAsText(file);
  }

  private processCsvUpload(file: File, input: HTMLInputElement): void {
    this.loading.set(true);
    this.error.set('');

    this.api.uploadGradesCsv(this.courseId, file).subscribe({
      next: (responses) => {
        this.loading.set(false);
        this.error.set('');
        this.toast.success(`Successfully processed ${responses.length} grades from CSV! 🎉`);
        this.loadData();
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.detail || err.error?.message || (typeof err.error === 'string' ? err.error : 'Failed to upload CSV grades');
        this.error.set(msg);
        this.toast.error(msg);
        setTimeout(() => this.error.set(''), 5000);
      }
    });

    input.value = '';
  }
}
