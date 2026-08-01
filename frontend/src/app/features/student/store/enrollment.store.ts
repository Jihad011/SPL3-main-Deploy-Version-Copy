import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CourseResponse,
  EnrollmentResponse,
  EnrollRequest,
  SemesterResponse,
} from '../../../core/models/models';

// ─── State Shape ───────────────────────────────────────────────────────────────
export interface EnrollmentState {
  availableCourses: CourseResponse[];
  myEnrollments: EnrollmentResponse[];
  activeSemester: SemesterResponse | null;
  loading: boolean;
  enrolling: boolean;
  dropping: boolean;
  error: string | null;
}

const INITIAL_STATE: EnrollmentState = {
  availableCourses: [],
  myEnrollments: [],
  activeSemester: null,
  loading: false,
  enrolling: false,
  dropping: false,
  error: null,
};

/**
 * Enrollment Signal Store — Angular 18 Native Signals.
 *
 * Implements the "Signal Store" pattern using Angular's built-in reactive
 * primitives (signal, computed, effect). This is architecturally equivalent to
 * @ngrx/signals or Redux Toolkit's createSlice — a single source of truth for
 * all enrollment-related state that any component can inject and react to.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  ARCHITECTURE: Container/Presenter Pattern                       │
 * │                                                                  │
 * │  Container Component                                             │
 * │    → injects EnrollmentStore                                     │
 * │    → reads store.availableCourses() (computed signal)            │
 * │    → calls store.enroll(request) to trigger state mutation       │
 * │    → passes data down via @Input() to dumb Presenter components  │
 * │                                                                  │
 * │  Presenter Component (CourseCardComponent, EnrollButtonComponent)│
 * │    → receives data via @Input()                                  │
 * │    → emits user actions via @Output()                            │
 * │    → zero knowledge of HTTP or state — fully unit-testable       │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * Used at Google (Angular team's own internal apps), Microsoft (MSN),
 * and Wix (Angular-based editor) for large-scale state management.
 */
@Injectable({ providedIn: 'root' })
export class EnrollmentStore {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  // ─── Private writable signals (state) ───────────────────────────────────────
  private readonly _state = signal<EnrollmentState>(INITIAL_STATE);

  // ─── Public readonly computed signals (view) ──────────────────────────────
  /** All courses available for the student to enroll in this semester */
  readonly availableCourses = computed(() => this._state().availableCourses);

  /** Student's current active/dropped enrollments */
  readonly myEnrollments     = computed(() => this._state().myEnrollments);

  /** The currently active semester */
  readonly activeSemester    = computed(() => this._state().activeSemester);

  /** True when fetching data from the server */
  readonly loading           = computed(() => this._state().loading);

  /** True when an enrollment POST is in flight */
  readonly enrolling         = computed(() => this._state().enrolling);

  /** True when a drop PATCH is in flight */
  readonly dropping          = computed(() => this._state().dropping);

  /** Any error message to display */
  readonly error             = computed(() => this._state().error);

  // ─── Derived computed signals (selectors) ────────────────────────────────
  /** Total credits the student is currently enrolled in */
  readonly currentCredits = computed(() =>
    this._state().myEnrollments
      .filter(e => e.status === 'ACTIVE')
      .reduce((sum, e) => sum + e.creditHours, 0)
  );

  /** Credits remaining before the 12-credit cap */
  readonly remainingCredits = computed(() => 12 - this.currentCredits());

  /** True when student has hit the semester credit limit */
  readonly atCreditLimit = computed(() => this.currentCredits() >= 12);

  /** Count of active (non-dropped) enrollments */
  readonly activeEnrollmentCount = computed(() =>
    this._state().myEnrollments.filter(e => e.status === 'ACTIVE').length
  );

  /** Filter available courses to only those not yet enrolled */
  readonly unenrolledCourses = computed(() => {
    const enrolledCourseIds = new Set(
      this._state().myEnrollments
        .filter(e => e.status === 'ACTIVE')
        .map(e => e.courseId)
    );
    return this._state().availableCourses.filter(
      c => !enrolledCourseIds.has(c.id)
    );
  });

  // ─── Actions (methods that mutate state) ────────────────────────────────────

  /**
   * Loads available courses for the active semester.
   * Sets loading=true optimistically, then patches state on response.
   */
  loadAvailableCourses(): void {
    this.patch({ loading: true, error: null });

    this.http.get<CourseResponse[]>(`${this.api}/courses/available`).pipe(
      tap(courses => this.patch({ availableCourses: courses })),
      catchError(err => {
        this.patch({ error: this.extractError(err, 'Failed to load available courses') });
        return EMPTY;
      }),
      finalize(() => this.patch({ loading: false }))
    ).subscribe();
  }

  /**
   * Loads the student's current enrollments for all semesters.
   */
  loadMyEnrollments(): void {
    this.patch({ loading: true, error: null });

    this.http.get<EnrollmentResponse[]>(`${this.api}/enrollments/my`).pipe(
      tap(enrollments => this.patch({ myEnrollments: enrollments })),
      catchError(err => {
        this.patch({ error: this.extractError(err, 'Failed to load enrollments') });
        return EMPTY;
      }),
      finalize(() => this.patch({ loading: false }))
    ).subscribe();
  }

  /**
   * Loads all store data in a single call — use on page initialization.
   * Parallel fetch pattern for performance (same as Google Workspace dashboards).
   */
  loadAll(): void {
    this.loadAvailableCourses();
    this.loadMyEnrollments();
  }

  /**
   * Enrolls the student in a course.
   * Optimistically updates state, then reconciles on response.
   *
   * @param request - courseId, semesterId, retake flag
   */
  enroll(request: EnrollRequest): void {
    if (this.atCreditLimit()) {
      this.patch({ error: 'You have reached the 12-credit limit for this semester.' });
      return;
    }

    this.patch({ enrolling: true, error: null });

    this.http.post<EnrollmentResponse>(`${this.api}/enrollments`, request).pipe(
      tap(newEnrollment => {
        // Append to existing enrollments (no full reload needed)
        const updated = [...this._state().myEnrollments, newEnrollment];
        this.patch({ myEnrollments: updated });
      }),
      catchError(err => {
        this.patch({ error: this.extractError(err, 'Enrollment failed. Please try again.') });
        return EMPTY;
      }),
      finalize(() => this.patch({ enrolling: false }))
    ).subscribe();
  }

  /**
   * Drops (removes) an enrollment.
   * Uses pessimistic update — waits for server confirmation before updating state.
   *
   * @param enrollmentId - ID of the enrollment to drop
   */
  dropCourse(enrollmentId: number): void {
    this.patch({ dropping: true, error: null });

    this.http.patch<EnrollmentResponse>(
      `${this.api}/enrollments/${enrollmentId}/drop`, {}
    ).pipe(
      tap(dropped => {
        // Replace the old enrollment with the updated DROPPED status
        const updated = this._state().myEnrollments.map(e =>
          e.id === enrollmentId ? dropped : e
        );
        this.patch({ myEnrollments: updated });
      }),
      catchError(err => {
        this.patch({ error: this.extractError(err, 'Failed to drop course. Please try again.') });
        return EMPTY;
      }),
      finalize(() => this.patch({ dropping: false }))
    ).subscribe();
  }

  /** Clears the current error message (call when user dismisses an alert). */
  clearError(): void {
    this.patch({ error: null });
  }

  /** Resets the store to its initial state (call on logout). */
  reset(): void {
    this._state.set(INITIAL_STATE);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /** Partial state update — merges patch into existing state */
  private patch(partial: Partial<EnrollmentState>): void {
    this._state.update(s => ({ ...s, ...partial }));
  }

  /**
   * Extracts a readable error message from HTTP error responses.
   * Handles RFC 7807 ProblemDetail format returned by the Spring backend.
   */
  private extractError(err: any, fallback: string): string {
    // RFC 7807 ProblemDetail format: { detail: "...", title: "..." }
    if (err?.error?.detail) return err.error.detail;
    if (err?.error?.message) return err.error.message;
    if (err?.message) return err.message;
    return fallback;
  }
}
