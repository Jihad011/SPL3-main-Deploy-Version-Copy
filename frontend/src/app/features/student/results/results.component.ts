import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { PdfService } from '../../../core/services/pdf.service';
import { GradeResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';

// CenterPoint Shared Components
import {
  SummaryCardStrip,
  SummaryCardItem,
  GenericButton
} from '../../../shared';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    IconComponent,
    SummaryCardStrip,
    GenericButton
  ],
  template: `
<div class="page">
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-eyebrow">Academic performance</div>
      <h1 class="page-title">Academic Results</h1>
      <p class="page-subtitle">Your full academic transcript and term-by-term assessment breakdown</p>
    </div>
    
    <div class="header-actions" style="display:flex; align-items:center; gap: 1rem;">
      <generic-button
        *ngIf="!loading() && grades().length > 0"
        [label]="downloading() ? 'Generating PDF...' : 'Download Official Transcript (PDF)'"
        icon="download"
        [enable]="!downloading()"
        (onClick)="downloadTranscript()"
      />

      <!-- CGPA Ring in header -->
      <div class="header-cgpa-ring" *ngIf="!loading() && grades().length > 0">
        <svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg" style="transform:rotate(-90deg)">
          <circle cx="40" cy="40" r="32" fill="none" stroke="var(--bg-elevated)" stroke-width="7"/>
          <circle cx="40" cy="40" r="32" fill="none"
            [attr.stroke]="cgpaColor(cgpa())"
            stroke-width="7" stroke-linecap="round"
            stroke-dasharray="201.1"
            [attr.stroke-dashoffset]="201.1 * (1 - cgpa() / 4.0)"
            style="transition: stroke-dashoffset 1s ease"/>
        </svg>
        <div class="header-cgpa-text">
          <div class="header-cgpa-val font-mono">{{ cgpa() | number:'1.2-2' }}</div>
          <div class="header-cgpa-lbl">CGPA</div>
        </div>
      </div>
    </div>
  </div>

  <div class="spinner-wrapper" *ngIf="loading()"><div class="spinner"></div></div>
  <div class="alert alert-error" *ngIf="error()">
    <app-icon name="alert-triangle" [size]="16"></app-icon>{{ error() }}
  </div>

  <!-- Summary Card Strip -->
  <div style="margin-bottom: 1.5rem;" *ngIf="!loading() && grades().length > 0">
    <app-summary-card-strip [items]="summaryItems()" displayMode="page" />
  </div>

  <!-- Semester accordion -->
  <ng-container *ngFor="let sem of semesters(); let idx = index">
    <div class="accordion-card" [class.accordion-open]="isOpen(sem)">
      <button class="accordion-header" (click)="toggle(sem)">
        <div class="accordion-left">
          <div class="accordion-semester-dot" [style.background]="semColor(idx)"></div>
          <div>
            <div class="accordion-title">{{ sem }}</div>
            <div class="accordion-sub">Term CGPA: <strong [style.color]="cgpaColor(+getSemesterGpa(sem))">{{ getSemesterGpa(sem) }}</strong> · CGPA: <strong [style.color]="cgpaColor(+getSemesterCgpa(sem))">{{ getSemesterCgpa(sem) }}</strong> · {{ getSemesterGrades(sem).length }} course(s)</div>
          </div>
        </div>
        <div class="accordion-chips">
          <span class="gpa-chip font-mono" [style.background]="cgpaColor(+getSemesterGpa(sem)) + '18'" [style.color]="cgpaColor(+getSemesterGpa(sem))">
            {{ getSemesterGpa(sem) }}
          </span>
          <span class="accordion-chevron" [class.rotated]="isOpen(sem)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </span>
        </div>
      </button>

      <div class="accordion-body" *ngIf="isOpen(sem)">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Name</th>
                <th>Credits</th>
                <th>Midterm</th>
                <th>Final</th>
                <th>Total</th>
                <th>Grade</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let g of getSemesterGrades(sem)" class="result-row">
                <td><span class="code-badge font-mono">{{ g.courseCode }}</span></td>
                <td><strong>{{ g.courseName }}</strong></td>
                <td>{{ g.creditHours }}</td>
                <td class="numeric font-mono">{{ g.midtermMarks ?? '—' }}<span *ngIf="g.midtermMarks !== null" class="mark-denominator">/40</span></td>
                <td class="numeric font-mono">{{ g.finalMarks ?? '—' }}<span *ngIf="g.finalMarks !== null" class="mark-denominator">/60</span></td>
                <td class="numeric font-mono"><strong *ngIf="g.totalMarks !== null">{{ g.totalMarks }}</strong><span *ngIf="g.totalMarks === null" class="text-muted">—</span></td>
                <td>
                  <span class="grade-badge font-mono font-bold" [class]="gradeClass(g.gradeLetter)">
                    {{ g.gradeDisplay ?? 'Pending' }}
                  </span>
                </td>
                <td>
                  <span *ngIf="g.gradePoint !== null" class="grade-point font-mono font-bold">{{ g.gradePoint | number:'1.2-2' }}</span>
                  <span *ngIf="g.gradePoint === null" class="text-muted">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </ng-container>

  <div class="empty-state" *ngIf="!loading() && grades().length === 0">
    <div class="empty-icon"><app-icon name="star" [size]="28"></app-icon></div>
    <h3>No results yet</h3>
    <p>Your grades will appear here once teachers enter your marks.</p>
  </div>
</div>
  `,
  styles: [`
    /* Header CGPA ring */
    .header-cgpa-ring {
      position: relative; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .header-cgpa-text {
      position: absolute; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .header-cgpa-val { font-size: 1.1rem; font-weight: 800; line-height: 1; color: var(--text-primary); }
    .header-cgpa-lbl { font-size: 0.6rem; color: var(--text-muted); font-weight: 600; letter-spacing: 0.1em; }

    /* Accordion */
    .accordion-card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 16px; overflow: hidden; margin-bottom: 0.875rem;
      transition: border-color .2s;
    }
    .accordion-card.accordion-open { border-color: var(--accent-primary); }
    .accordion-header {
      width: 100%; padding: 1.25rem 1.5rem; display: flex; align-items: center;
      justify-content: space-between; border: none; background: none;
      cursor: pointer; transition: background .2s; font-family: inherit;
      gap: 1rem;
    }
    .accordion-header:hover { background: var(--bg-card-hover, rgba(255,255,255,0.02)); }
    .accordion-left { display: flex; align-items: center; gap: 1rem; }
    .accordion-semester-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .accordion-title { font-weight: 700; font-size: 0.975rem; color: var(--text-primary); }
    .accordion-sub { font-size: 0.78rem; color: var(--text-muted); margin-top: 0.15rem; }
    .accordion-chips { display: flex; align-items: center; gap: 0.75rem; }
    .gpa-chip {
      padding: 0.25rem 0.75rem; border-radius: 20px;
      font-size: 0.82rem; font-weight: 700;
    }
    .accordion-chevron {
      color: var(--text-muted); transition: transform .3s cubic-bezier(0.4,0,0.2,1);
      display: flex;
    }
    .accordion-chevron.rotated { transform: rotate(180deg); }
    .accordion-body { border-top: 1px solid var(--border); animation: fadeIn .2s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    .result-row:hover td { background: rgba(34,211,238,0.02); }
    .mark-denominator { color: var(--text-muted); font-size: 0.75rem; }
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
export class ResultsComponent implements OnInit {
  grades = signal<GradeResponse[]>([]);
  cgpa = signal<number>(0);
  loading = signal(true);
  downloading = signal(false);
  error = signal('');
  private openSemesters = new Set<string>();

  gradesBySemester = computed(() => {
    const map = new Map<string, GradeResponse[]>();
    for (const g of this.grades()) {
      const sem = g.semesterLabel;
      if (!map.has(sem)) map.set(sem, []);
      map.get(sem)!.push(g);
    }
    return map;
  });

  semesters = computed(() => Array.from(this.gradesBySemester().keys()));
  completedCourses = computed(() => this.grades().filter(g => g.gradePoint !== null).length);
  earnedCredits = computed(() =>
    this.grades().filter(g => g.gradePoint !== null).reduce((sum, g) => sum + g.creditHours, 0)
  );

  summaryItems = computed<SummaryCardItem[]>(() => [
    { key: 'courses', label: 'Graded Courses', value: this.completedCourses(), tone: 'success', icon: 'completed' },
    { key: 'credits', label: 'Earned Credits', value: `${this.earnedCredits()} Cr`, tone: 'primary', icon: 'completed' },
    { key: 'semesters', label: 'Enrolled Semesters', value: this.semesters().length, tone: 'neutral', icon: 'calendar' }
  ]);

  constructor(
    private api: ApiService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    this.api.getMyGrades().subscribe({
      next: (g) => {
        this.grades.set(g);
        if (g.length) this.openSemesters.add(g[0].semesterLabel);
        this.loading.set(false);
      },
      error: () => { this.error.set('Failed to load results.'); this.loading.set(false); }
    });
    this.api.getMyCgpa().subscribe({ next: (r) => this.cgpa.set(r.cgpa) });
  }

  toggle(sem: string): void {
    if (this.openSemesters.has(sem)) this.openSemesters.delete(sem);
    else this.openSemesters.add(sem);
  }
  isOpen(sem: string): boolean { return this.openSemesters.has(sem); }

  getSemesterGrades(sem: string): GradeResponse[] { return this.gradesBySemester().get(sem) ?? []; }

  downloadTranscript(): void {
    this.downloading.set(true);
    this.api.getMyAcademicHistory().subscribe({
      next: (history) => {
        this.downloading.set(false);
        try {
          this.pdfService.generateTranscriptPdf(history);
        } catch (e) {
          console.error('Failed to generate transcript PDF', e);
          this.error.set('Failed to generate PDF. Please try again.');
        }
      },
      error: () => {
        this.downloading.set(false);
        this.error.set('Failed to fetch academic history for transcript. Please try again.');
      }
    });
  }

  getSemesterGpa(sem: string): string {
    const grades = this.getSemesterGrades(sem).filter(g => g.gradePoint !== null);
    if (!grades.length) return '—';
    const total = grades.reduce((s, g) => s + (g.gradePoint! * g.creditHours), 0);
    const credits = grades.reduce((s, g) => s + g.creditHours, 0);
    return credits ? (total / credits).toFixed(2) : '—';
  }

  getSemesterCgpa(sem: string): string {
    const allSems = this.semesters();
    const idx = allSems.indexOf(sem);
    if (idx === -1) return '—';
    const relSems = allSems.slice(0, idx + 1);
    const grades = this.grades().filter(g => relSems.includes(g.semesterLabel) && g.gradePoint !== null);
    if (!grades.length) return '—';
    const total = grades.reduce((s, g) => s + (g.gradePoint! * g.creditHours), 0);
    const credits = grades.reduce((s, g) => s + g.creditHours, 0);
    return credits ? (total / credits).toFixed(2) : '—';
  }

  cgpaColor(val: number): string {
    if (val >= 3.5) return '#34d399';
    if (val >= 3.0) return '#22d3ee';
    if (val >= 2.5) return '#fbbf24';
    if (val >= 2.0) return '#fb923c';
    return '#f87171';
  }

  semColor(idx: number): string {
    const colors = ['#22d3ee', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#fbbf24'];
    return colors[idx % colors.length];
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
}
