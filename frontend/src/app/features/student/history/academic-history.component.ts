import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { PdfService } from '../../../core/services/pdf.service';
import { StudentHistoryResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CardGlowDirective } from '../../../shared/directives/card-glow.directive';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-academic-history',
  standalone: true,
  imports: [CommonModule, DecimalPipe, IconComponent, CardGlowDirective, SkeletonComponent],
  templateUrl: './academic-history.component.html',
  styleUrl: './academic-history.component.scss'
})
export class AcademicHistoryComponent implements OnInit {
  loading = signal<boolean>(true);
  downloadingPdf = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  history = signal<StudentHistoryResponse | null>(null);
  collapsedSemesters = signal<Set<number>>(new Set<number>());

  constructor(
    private api: ApiService,
    private pdfService: PdfService
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  toggleSemester(semId: number): void {
    this.collapsedSemesters.update(set => {
      const newSet = new Set(set);
      if (newSet.has(semId)) newSet.delete(semId);
      else newSet.add(semId);
      return newSet;
    });
  }

  isCollapsed(semId: number): boolean {
    return this.collapsedSemesters().has(semId);
  }

  toggleAllSemesters(): void {
    const sems = this.history()?.semesters || [];
    if (this.collapsedSemesters().size > 0) {
      this.collapsedSemesters.set(new Set<number>());
    } else {
      this.collapsedSemesters.set(new Set<number>(sems.map(s => s.semesterId)));
    }
  }

  loadHistory(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.api.getMyAcademicHistory().subscribe({
      next: (data) => {
        this.history.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.detail || err?.error?.message || 'Failed to load your academic dossier.');
      }
    });
  }

  downloadTranscript(): void {
    const data = this.history();
    if (!data) return;

    this.downloadingPdf.set(true);
    try {
      this.pdfService.generateTranscriptPdf(data);
    } catch (e) {
      console.error('Failed to generate transcript PDF', e);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      this.downloadingPdf.set(false);
    }
  }

  getCgpaBadgeClass(cgpa: number): string {
    if (cgpa >= 3.75) return 'cgpa-excellent';
    if (cgpa >= 3.00) return 'cgpa-good';
    if (cgpa >= 2.50) return 'cgpa-avg';
    return 'cgpa-low';
  }

  getGradeBadgeClass(letter: string): string {
    if (!letter || letter === 'IN_PROGRESS') return 'badge-ip';
    if (letter.startsWith('A')) return 'badge-a';
    if (letter.startsWith('B')) return 'badge-b';
    if (letter.startsWith('C')) return 'badge-c';
    if (letter === 'F') return 'badge-f';
    return 'badge-d';
  }
}
