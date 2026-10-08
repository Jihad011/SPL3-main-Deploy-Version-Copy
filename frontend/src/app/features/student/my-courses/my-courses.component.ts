import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { EnrollmentResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToolbarComponent } from '../../../shared/components/toolbar/toolbar.component';
import { ToastService } from '../../../core/services/toast.service';

// CenterPoint Shared Components
import {
  SummaryCardStrip,
  SummaryCardItem
} from '../../../shared';

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DatePipe,
    IconComponent,
    ToolbarComponent,
    SummaryCardStrip
  ],
  templateUrl: './my-courses.component.html',
  styleUrls: ['./my-courses.component.scss']
})
export class MyCoursesComponent implements OnInit {
  enrollments = signal<EnrollmentResponse[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  statusFilter = signal<string>('ALL');
  selectedSemesterFilter = signal<string>('ALL');
  view = signal<'grid' | 'list'>('grid');

  activeCount = computed(() => this.enrollments().filter(e => e.status === 'ACTIVE').length);
  completedCount = computed(() => this.enrollments().filter(e => e.status === 'COMPLETED').length);
  droppedCount = computed(() => this.enrollments().filter(e => e.status === 'DROPPED').length);

  totalCredits = computed(() =>
    this.enrollments()
      .filter(e => e.status === 'ACTIVE' || e.status === 'COMPLETED')
      .reduce((sum, e) => sum + e.creditHours, 0)
  );

  filteredActiveCount = computed(() => this.filteredEnrollments().filter(e => e.status === 'ACTIVE').length);
  filteredTotalCredits = computed(() =>
    this.filteredEnrollments()
      .filter(e => e.status === 'ACTIVE' || e.status === 'COMPLETED')
      .reduce((sum, e) => sum + e.creditHours, 0)
  );

  summaryItems = computed<SummaryCardItem[]>(() => [
    { key: 'active', label: 'Active Enrollments', value: this.filteredActiveCount(), tone: 'success', icon: 'completed' },
    { key: 'credits', label: 'Registered Credits', value: `${this.filteredTotalCredits()} Cr`, tone: 'primary', icon: 'completed' },
    { key: 'completed', label: 'Completed Courses', value: this.completedCount(), tone: 'neutral', icon: 'info' }
  ]);

  filteredEnrollments = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const sf = this.statusFilter();
    const semFilter = this.selectedSemesterFilter();

    return this.enrollments().filter(e => {
      const matchesStatus = sf === 'ALL' || e.status === sf;

      let matchesSem = true;
      if (semFilter !== 'ALL') {
        const targetSemNum = parseInt(semFilter, 10);
        const lvl = e.targetSemesterLevel ?? (
          ['MITM 303', 'MITM 304', 'MITM 310', 'MITM 311'].includes(e.courseCode) ? 1 :
          ['MITM 301', 'MITM 305'].includes(e.courseCode) ? 2 :
          e.courseCode === 'MITM 421' ? 3 : 2
        );
        matchesSem = (lvl === targetSemNum);
      }

      const matchesQuery = !q ||
        e.courseName.toLowerCase().includes(q) ||
        e.courseCode.toLowerCase().includes(q) ||
        e.semesterLabel.toLowerCase().includes(q);

      return matchesStatus && matchesSem && matchesQuery;
    });
  });

  constructor(private api: ApiService, private toast: ToastService) {}

  getInstructorName(e: EnrollmentResponse): string {
    if (e.teacherName && e.teacherName !== 'Faculty Instructor') {
      return e.teacherName;
    }
    const map: Record<string, string> = {
      'MITM 303': 'Dr. Md. Shariful Islam',
      'MITM 304': 'Dr. Mohammad Shoyaib',
      'MITM 310': 'Dr. Ahmedul Kabir',
      'MITM 311': 'Dr. B. M. Mainul Hossain',
      'MITM 301': 'Md. Saeed Siddik',
      'MITM 305': 'Dr. Md. Nurul Ahad Tawhid',
      'MITM 421': 'Dr. Ahmedul Kabir',
      'MITE 436': 'Dr. Ahmedul Kabir',
      'MITE 430': 'Dr. B. M. Mainul Hossain',
      'MITE 437': 'Dr. Mohammad Shoyaib',
      'MITE 431': 'Dr. B. M. Mainul Hossain',
      'MITE 434': 'Md. Saeed Siddik',
      'MITE 439': 'Dr. Kazi Muheymin-Us-Sakib',
      'MITE 435': 'Toukir Ahammed',
      'MITE 441': 'Toukir Ahammed',
      'MITE 432': 'Dr. Md. Shariful Islam',
      'MITE 442': 'Dr. Md. Shariful Islam',
      'MITE 438': 'Dr. Md. Shariful Islam',
      'MITE 455': 'Dr. Md. Shariful Islam',
      'MITE 433': 'Dr. Md. Shariful Islam'
    };
    return map[e.courseCode] || 'Faculty Instructor';
  }

  getSemesterDisplay(e: EnrollmentResponse): string {
    const lvl = e.targetSemesterLevel ?? (
      ['MITM 303', 'MITM 304', 'MITM 310', 'MITM 311'].includes(e.courseCode) ? 1 :
      ['MITM 301', 'MITM 305'].includes(e.courseCode) ? 2 :
      e.courseCode === 'MITM 421' ? 3 : 2
    );

    const semName = lvl === 1 ? 'First Semester' : (lvl === 2 ? 'Second Semester' : (lvl === 3 ? 'Third Semester' : `${lvl}th Semester`));
    const intake = e.intakeType ? ` (${e.intakeType} Intake)` : '';
    return `${semName}${intake}`;
  }

  getSyllabusFullUrl(url: string | null | undefined): string {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:8080/api${url.startsWith('/') ? '' : '/'}${url}`;
  }

  ngOnInit(): void {
    this.loadEnrollments();
  }

  loadEnrollments(): void {
    this.loading.set(true);
    this.api.getMyEnrollments().subscribe({
      next: (data) => {
        this.enrollments.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load registered courses.');
        this.loading.set(false);
      }
    });
  }
}
