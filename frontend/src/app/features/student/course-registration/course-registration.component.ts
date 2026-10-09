import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CourseResponse, SemesterResponse, EnrollmentResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToolbarComponent, FilterOption } from '../../../shared/components/toolbar/toolbar.component';
import { ToastService } from '../../../core/services/toast.service';

// CenterPoint Shared Components
import {
  ConfirmationDialogue,
  GenericButton
} from '../../../shared';

@Component({
  selector: 'app-course-registration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IconComponent,
    ToolbarComponent,
    ConfirmationDialogue,
    GenericButton
  ],
  templateUrl: './course-registration.component.html',
  styleUrls: ['./course-registration.component.scss']
})
export class CourseRegistrationComponent implements OnInit {
  courses = signal<CourseResponse[]>([]);
  activeSemId = signal<number | null>(null);
  activeSemester = signal<SemesterResponse | null>(null);
  loading = signal(true);
  enrolling = signal<number | null>(null);
  success = signal('');
  error = signal('');
  query = signal('');
  view = signal<'grid' | 'list'>('grid');
  selectedType = signal('ALL');
  selectedSemesterLevel = signal<number>(1);
  selectedSemesterType = signal<'Spring' | 'Fall'>('Spring');

  allEnrollments = signal<EnrollmentResponse[]>([]);
  readonly maxCredits = 12;

  showConfirmDialogue = signal(false);
  pendingEnrollCourse = signal<CourseResponse | null>(null);
  pendingRetake = signal(false);

  /**
   * 1. Semester-scoped available courses:
   * Level 1 (1st Sem): ONLY 4 mandatory courses (MITM 303, 304, 310, 311) - strictly NO optional courses (Count: 4)
   * Level 2 (2nd Sem): 2 mandatory courses (MITM 301, 305) + 12 optional courses (Count: 14)
   * Level 3 (3rd Sem): 1 mandatory project (MITM 421) + 12 optional courses (Count: 13)
   */
  semesterCourses = computed(() => {
    const all = this.courses();
    const level = this.selectedSemesterLevel();

    if (level === 1) {
      return all.filter(c => (c.semesterLevel === 1 || ['MITM 303', 'MITM 304', 'MITM 310', 'MITM 311'].includes(c.code)) && c.courseType !== 'OPTIONAL');
    } else if (level === 2) {
      return all.filter(c => c.semesterLevel === 2 || ['MITM 301', 'MITM 305'].includes(c.code) || c.courseType === 'OPTIONAL');
    } else if (level === 3) {
      return all.filter(c => c.semesterLevel === 3 || c.code === 'MITM 421' || c.courseType === 'OPTIONAL');
    }
    return all;
  });

  /**
   * 2. Category / Track tabs computed dynamically from the active semester's courses.
   * For 1st Semester, only 'Core Major' (Mandatory) exists.
   * For 2nd and 3rd Semester, track tabs appear based on elective courses available.
   */
  courseTypes = computed(() => {
    const tracks = new Set<string>();
    for (const c of this.semesterCourses()) {
      if (c.track) tracks.add(c.track);
      else if (c.courseType) tracks.add(c.courseType);
    }
    return Array.from(tracks);
  });

  getTrackCount(type: string): number {
    return this.semesterCourses().filter(c => c.track === type || c.courseType === type).length;
  }

  filterOptions = computed<FilterOption[]>(() => {
    return this.courseTypes().map(type => ({
      label: type,
      value: type,
      count: this.getTrackCount(type)
    }));
  });

  /**
   * 3. Filtered courses according to selected category tab and search query.
   */
  filteredCourses = computed(() => {
    let result = this.semesterCourses();
    const type = this.selectedType();
    if (type !== 'ALL') {
      result = result.filter(c => c.track === type || c.courseType === type);
    }
    const q = this.query().trim().toLowerCase();
    if (q) {
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.track || '').toLowerCase().includes(q) ||
        (c.teacherName || '').toLowerCase().includes(q)
      );
    }
    return result;
  });

  onSemesterLevelChange(level: number): void {
    this.selectedSemesterLevel.set(level);
    this.selectedType.set('ALL'); // Reset filter so courses don't vanish
  }

  onSemesterTypeChange(type: 'Spring' | 'Fall'): void {
    this.selectedSemesterType.set(type);
    this.selectedType.set('ALL');
  }

  isCourseEnrolled(courseCode: string): boolean {
    const level = this.selectedSemesterLevel();
    const type = this.selectedSemesterType();

    return this.allEnrollments().some(e => {
      if (e.courseCode !== courseCode) return false;
      if (e.status !== 'ACTIVE' && e.status !== 'COMPLETED') return false;

      const eLevel = e.targetSemesterLevel ?? (
        ['MITM 303', 'MITM 304', 'MITM 310', 'MITM 311'].includes(e.courseCode) ? 1 :
        ['MITM 301', 'MITM 305'].includes(e.courseCode) ? 2 :
        e.courseCode === 'MITM 421' ? 3 : 2
      );

      const eType = e.intakeType || 'Spring';
      return eLevel === level && eType.toLowerCase() === type.toLowerCase();
    });
  }

  currentEnrolledCredits = computed(() => {
    const enrollments = this.allEnrollments();
    const level = this.selectedSemesterLevel();
    const type = this.selectedSemesterType();

    const activeLevelEnrollments = enrollments.filter(e => {
      if (e.status !== 'ACTIVE' && e.status !== 'COMPLETED') return false;
      const eLevel = e.targetSemesterLevel ?? (
        ['MITM 303', 'MITM 304', 'MITM 310', 'MITM 311'].includes(e.courseCode) ? 1 :
        ['MITM 301', 'MITM 305'].includes(e.courseCode) ? 2 :
        e.courseCode === 'MITM 421' ? 3 : 2
      );
      const eType = e.intakeType || 'Spring';
      return eLevel === level && eType.toLowerCase() === type.toLowerCase();
    });

    return activeLevelEnrollments.reduce((sum, e) => sum + (e.creditHours || 0), 0);
  });

  remainingCredits = computed(() => Math.max(0, this.maxCredits - this.currentEnrolledCredits()));

  totalCompletedCredits = signal<number>(0);

  studentSemesterLevel = computed(() => {
    const credits = this.totalCompletedCredits();
    if (credits >= 24) return 3; // 3rd Semester
    if (credits >= 12) return 2; // 2nd Semester
    return 1;                    // 1st Semester
  });

  confirmMessage = computed(() => {
    const course = this.pendingEnrollCourse();
    return course ? `Are you sure you want to register for ${course.code} — ${course.name} (${course.creditHours} Credits)?` : '';
  });

  constructor(private api: ApiService, private toast: ToastService) {}

  getInstructorName(c: CourseResponse): string {
    if (c.teacherName && c.teacherName !== 'Faculty TBA' && c.teacherName !== 'Faculty Instructor') {
      return c.teacherName;
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
    return map[c.code] || 'Faculty Instructor';
  }

  getCourseSemesterDisplay(c: CourseResponse): string {
    if (c.semesterLevel === 1 || ['MITM 303', 'MITM 304', 'MITM 310', 'MITM 311'].includes(c.code)) return 'First Semester';
    if (c.semesterLevel === 2 || ['MITM 301', 'MITM 305'].includes(c.code)) return 'Second Semester';
    if (c.semesterLevel === 3 || c.code === 'MITM 421') return 'Third Semester';
    return 'Second & Third Semester';
  }

  getSyllabusFullUrl(url: string | null): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url}`;
  }

  getCourseEnrollmentCount(c: CourseResponse): number {
    const intake = this.selectedSemesterType();
    // If Spring Intake: The 40 students are enrolled in the 1st semester core courses
    if (intake === 'Spring') {
      return c.currentEnrollment;
    }
    // Fall Intake is a fully independent intake cycle.
    // If this student is enrolled in Fall, count 1, otherwise seats are open (0)
    return this.isCourseEnrolled(c.code) ? 1 : 0;
  }

  isCourseFull(c: CourseResponse): boolean {
    const max = c.maxSeats || 40;
    return this.getCourseEnrollmentCount(c) >= max;
  }

  getAvailableSeats(c: CourseResponse): number {
    const max = c.maxSeats || 40;
    return Math.max(0, max - this.getCourseEnrollmentCount(c));
  }

  ngOnInit(): void {
    this.loadActiveSemester();
    this.loadEnrolledCredits();
    this.loadCourses();
  }

  loadActiveSemester(): void {
    this.api.getActiveSemesters().subscribe({
      next: (sems) => {
        if (sems && sems.length > 0) {
          this.activeSemId.set(sems[0].id);
          this.activeSemester.set(sems[0]);
        }
      }
    });
  }

  loadEnrolledCredits(): void {
    this.api.getMyEnrollments().subscribe({
      next: (enrollments) => {
        const list = enrollments || [];
        this.allEnrollments.set(list);

        const completed = list.filter(e => e.status === 'COMPLETED');
        const completedTotal = completed.reduce((acc, e) => acc + (e.creditHours || 0), 0);
        this.totalCompletedCredits.set(completedTotal);
      },
      error: () => {}
    });
  }

  loadCourses(): void {
    this.loading.set(true);
    this.api.getAllCourses().subscribe({
      next: (c) => { this.courses.set(c); this.loading.set(false); },
      error: () => { this.error.set('Failed to load courses.'); this.loading.set(false); }
    });
  }

  onFilterChange(types: string[]): void {
    if (types.length === 0) this.selectedType.set('ALL');
    else this.selectedType.set(types[0]);
  }

  enroll(course: CourseResponse, retake = false): void {
    const semId = this.activeSemId();
    if (!semId) {
      this.error.set('No active semester found for enrollment.');
      this.toast.error('No active semester found for enrollment.');
      return;
    }

    if (this.currentEnrolledCredits() + course.creditHours > this.maxCredits) {
      this.toast.warning(`Enrolling in this course exceeds your ${this.maxCredits} credit term limit.`);
      return;
    }

    this.pendingEnrollCourse.set(course);
    this.pendingRetake.set(retake);
    this.showConfirmDialogue.set(true);
  }

  onConfirmModalAction(event: any): void {
    this.showConfirmDialogue.set(false);
    if (event && (event.action === 'confirm' || event.action === 'click')) {
      this.confirmEnrollment();
    }
  }

  confirmEnrollment(): void {
    const course = this.pendingEnrollCourse();
    const semId = this.activeSemId();
    if (!course || !semId) return;

    this.success.set('');
    this.error.set('');
    this.enrolling.set(course.id);

    this.api.enroll({
      courseId: course.id,
      semesterId: semId,
      retake: this.pendingRetake(),
      targetSemesterLevel: this.selectedSemesterLevel(),
      intakeType: this.selectedSemesterType()
    }).subscribe({
      next: () => {
        this.enrolling.set(null);
        const msg = `Successfully enrolled in ${course.name}!`;
        this.success.set(msg);
        this.toast.success(msg + ' View in My Course(s).');
        this.loadEnrolledCredits();
        this.loadCourses();
      },
      error: (e) => {
        this.enrolling.set(null);
        const msg = e.error?.detail || e.error?.message || 'Enrollment failed.';
        this.error.set(msg);
        this.toast.error(msg);
      }
    });
  }
}
