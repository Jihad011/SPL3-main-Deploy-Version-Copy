import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY, finalize, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GradeResponse, GradeEntryRequest } from '../../../core/models/models';

// ─── State Shape ───────────────────────────────────────────────────────────────
export interface GradeSheetState {
  grades: GradeResponse[];
  pendingUpdates: Map<number, GradeEntryRequest>; // enrollmentId → pending update
  saving: boolean;
  loading: boolean;
  error: string | null;
  lastSavedAt: Date | null;
}

const INITIAL_STATE: GradeSheetState = {
  grades: [],
  pendingUpdates: new Map(),
  saving: false,
  loading: false,
  error: null,
  lastSavedAt: null,
};

/**
 * Grade Sheet Signal Store — Angular 18 Native Signals.
 *
 * Manages the grade entry workflow for teachers. Supports:
 * - Optimistic local updates (marks update in UI instantly while save is in flight)
 * - Batch save (one HTTP call saves all pending grade changes at once)
 * - "Dirty" tracking (knows which rows have unsaved changes)
 *
 * This pattern (local pending state + batch commit) is used in:
 * - Google Sheets (local edits, synced on commit)
 * - Microsoft Excel Online (optimistic local state)
 * - Notion (draft state before persist)
 */
@Injectable({ providedIn: 'root' })
export class GradeStore {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  // ─── Private writable signal ──────────────────────────────────────────────
  private readonly _state = signal<GradeSheetState>(INITIAL_STATE);

  // ─── Public computed signals ──────────────────────────────────────────────
  readonly grades       = computed(() => this._state().grades);
  readonly loading      = computed(() => this._state().loading);
  readonly saving       = computed(() => this._state().saving);
  readonly error        = computed(() => this._state().error);
  readonly lastSavedAt  = computed(() => this._state().lastSavedAt);

  /** True if there are local edits not yet saved to the server */
  readonly hasPendingChanges = computed(() => this._state().pendingUpdates.size > 0);

  /** Count of rows with pending local changes */
  readonly pendingCount = computed(() => this._state().pendingUpdates.size);

  /** Students with full grades (both midterm + final entered) */
  readonly fullyGraded = computed(() =>
    this._state().grades.filter(g => g.midtermMarks !== null && g.finalMarks !== null)
  );

  /** Students still missing at least one mark */
  readonly pendingGrades = computed(() =>
    this._state().grades.filter(g => g.midtermMarks === null || g.finalMarks === null)
  );

  /** Grade distribution summary: { 'A+': 3, 'A': 5, ... } */
  readonly gradeDistribution = computed(() => {
    const dist: Record<string, number> = {};
    for (const g of this._state().grades) {
      if (g.gradeLetter) {
        dist[g.gradeLetter] = (dist[g.gradeLetter] ?? 0) + 1;
      }
    }
    return dist;
  });

  /** Class average total marks (out of 100) */
  readonly classAverage = computed(() => {
    const graded = this._state().grades.filter(g => g.totalMarks !== null);
    if (graded.length === 0) return null;
    const sum = graded.reduce((acc, g) => acc + (g.totalMarks ?? 0), 0);
    return Math.round((sum / graded.length) * 100) / 100;
  });

  // ─── Actions ─────────────────────────────────────────────────────────────

  /**
   * Loads the grade sheet for a specific course and semester.
   */
  loadGradeSheet(courseId: number, semesterId: number): void {
    this.patch({ loading: true, error: null, pendingUpdates: new Map() });

    this.http.get<GradeResponse[]>(
      `${this.api}/grades/course/${courseId}/semester/${semesterId}`
    ).pipe(
      tap(grades => this.patch({ grades })),
      catchError(err => {
        this.patch({ error: this.extractError(err, 'Failed to load grade sheet.') });
        return EMPTY;
      }),
      finalize(() => this.patch({ loading: false }))
    ).subscribe();
  }

  /**
   * Stages a local grade change without saving to server.
   * The row updates optimistically in the UI.
   * Call savePendingChanges() to persist all staged updates.
   *
   * @param enrollmentId  - which enrollment row to update
   * @param update        - midterm and/or final marks
   */
  stageGradeUpdate(enrollmentId: number, update: Partial<Pick<GradeEntryRequest, 'midtermMarks' | 'finalMarks'>>): void {
    const pendingUpdates = new Map(this._state().pendingUpdates);
    const existing = pendingUpdates.get(enrollmentId) ?? { enrollmentId };
    pendingUpdates.set(enrollmentId, { ...existing, ...update, enrollmentId });

    // Optimistic update — reflect change in UI immediately
    const grades = this._state().grades.map(g => {
      if (g.enrollmentId !== enrollmentId) return g;
      const midterm = update.midtermMarks ?? g.midtermMarks;
      const final   = update.finalMarks   ?? g.finalMarks;
      const total   = (midterm !== null && final !== null) ? midterm + final : g.totalMarks;
      return { ...g, midtermMarks: midterm, finalMarks: final, totalMarks: total };
    });

    this.patch({ grades, pendingUpdates });
  }

  /**
   * Saves all staged grade updates to the server in a single batch request.
   * Clears the pending updates map on success.
   */
  savePendingChanges(): void {
    if (!this.hasPendingChanges()) return;

    this.patch({ saving: true, error: null });
    const requests: GradeEntryRequest[] = Array.from(this._state().pendingUpdates.values());

    this.http.post<GradeResponse[]>(`${this.api}/grades/bulk`, requests).pipe(
      tap(updatedGrades => {
        // Merge server response back into local state (server may have computed grade letters)
        const updatedMap = new Map(updatedGrades.map(g => [g.enrollmentId, g]));
        const grades = this._state().grades.map(g =>
          updatedMap.has(g.enrollmentId) ? updatedMap.get(g.enrollmentId)! : g
        );
        this.patch({ grades, pendingUpdates: new Map(), lastSavedAt: new Date() });
      }),
      catchError(err => {
        this.patch({ error: this.extractError(err, 'Failed to save grades. Please try again.') });
        return EMPTY;
      }),
      finalize(() => this.patch({ saving: false }))
    ).subscribe();
  }

  /**
   * Discards all local unsaved grade changes and reverts to last saved state.
   */
  discardPendingChanges(): void {
    const lastGrades = this._state().grades; // Keep grades but clear pending map
    this.patch({ pendingUpdates: new Map(), error: null });
    // Reload from server to get clean state
  }

  clearError(): void { this.patch({ error: null }); }

  reset(): void { this._state.set(INITIAL_STATE); }

  // ─── Private helpers ────────────────────────────────────────────────────────
  private patch(partial: Partial<GradeSheetState>): void {
    this._state.update(s => ({ ...s, ...partial }));
  }

  private extractError(err: any, fallback: string): string {
    if (err?.error?.detail) return err.error.detail;
    if (err?.error?.message) return err.error.message;
    if (err?.message) return err.message;
    return fallback;
  }
}
