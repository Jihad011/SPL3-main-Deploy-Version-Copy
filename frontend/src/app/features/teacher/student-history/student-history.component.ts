import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PdfService } from '../../../core/services/pdf.service';
import { StudentHistoryResponse, UserResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CardGlowDirective } from '../../../shared/directives/card-glow.directive';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-student-history',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, IconComponent, CardGlowDirective, SkeletonComponent],
  templateUrl: './student-history.component.html',
  styleUrl: './student-history.component.scss'
})
export class StudentHistoryComponent implements OnInit {
  searchQuery = '';
  loading = signal<boolean>(false);
  downloadingPdf = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  selectedStudent = signal<StudentHistoryResponse | null>(null);
  suggestedStudents = signal<UserResponse[]>([]);

  constructor(
    private api: ApiService,
    private pdfService: PdfService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSuggestions();

    // Subscribe to query parameters to support GET by ID and persistence across URL refresh
    this.route.queryParams.subscribe(params => {
      const q = params['id'] || params['q'] || params['roll'];
      if (q && q.trim() && q.trim() !== this.searchQuery) {
        this.searchQuery = q.trim();
        this.fetchStudentHistory(this.searchQuery);
      }
    });
  }

  loadSuggestions(): void {
    this.api.searchStudentsTeacher('').subscribe({
      next: (res) => this.suggestedStudents.set(res.slice(0, 8)),
      error: () => {}
    });
  }

  selectSuggested(roll: string | null): void {
    if (!roll) return;
    this.searchQuery = roll;
    this.searchStudent();
  }

  searchStudent(): void {
    const q = this.searchQuery.trim();
    if (!q) return;

    // Update URL query parameters so data persists on URL refresh
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: q },
      queryParamsHandling: 'merge'
    });

    this.fetchStudentHistory(q);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.selectedStudent.set(null);
    this.errorMessage.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: null },
      queryParamsHandling: 'merge'
    });
  }

  private fetchStudentHistory(query: string): void {
    if (!query) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.api.getStudentHistory(query).subscribe({
      next: (data) => {
        this.selectedStudent.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.selectedStudent.set(null);
        this.errorMessage.set(err?.error?.detail || err?.error?.message || `No student record found matching '${query}'`);
      }
    });
  }

  downloadPdf(studentId: number): void {
    const data = this.selectedStudent();
    if (!data) return;

    this.downloadingPdf.set(true);
    try {
      this.pdfService.generateTranscriptPdf(data);
    } catch (e) {
      console.error('Failed to generate student transcript PDF', e);
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
