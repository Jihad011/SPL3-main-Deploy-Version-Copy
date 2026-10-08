import { Component, EventEmitter, OnInit, Output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { CourseResponse } from '../../../core/models/models';
import { ExpansionSubPanelHeader } from '../../../shared/common-components/expansion-sub-panel-header/expansion-sub-panel-header';
import { ConfirmationDialogue } from '../../../shared/common-components/confirmation-dialogue/confirmation-dialogue';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-course-management-list',
  standalone: true,
  imports: [
    CommonModule,
    ExpansionSubPanelHeader,
    ConfirmationDialogue,
    IconComponent
  ],
  template: `
    <div class="page-wrapper" style="padding: 0.5rem;">
      <app-expansion-sub-panel-header
        [isOpenSignal]="listPanel"
        [subPanelTitle]="'Course Catalog & Faculty Syllabi'"
      />

      <div *ngIf="listPanel()" style="margin-top: 0.75rem;">
        <!-- Search bar -->
        <div style="margin-bottom: 0.85rem; display: flex; gap: 0.5rem; align-items: center;">
          <input
            type="text"
            placeholder="Search by course code, title, or assigned faculty..."
            [value]="searchQuery()"
            (input)="onSearchInput($event)"
            style="flex: 1; padding: 0.55rem 0.85rem; border-radius: 8px; border: 1px solid var(--border, #cbd5e1); font-size: 0.85rem; outline: none; background: var(--bg-card, #ffffff); color: var(--text-primary, #1e293b);"
          />
          <span class="font-mono text-xs text-muted" style="white-space: nowrap;">
            {{ filteredCourses().length }} Course(s)
          </span>
        </div>

        <div class="table-wrapper" style="overflow-x: auto; border: 1px solid var(--border, #e2e8f0); border-radius: 10px;">
          <table class="data-table" style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
            <thead>
              <tr style="background: var(--bg-elevated, #f8fafc); border-bottom: 1px solid var(--border, #e2e8f0);">
                <th style="padding: 0.65rem 0.85rem;">Code</th>
                <th style="padding: 0.65rem 0.85rem;">Course Title</th>
                <th style="padding: 0.65rem 0.85rem;">Credits</th>
                <th style="padding: 0.65rem 0.85rem;">Assigned Lead Faculty</th>
                <th style="padding: 0.65rem 0.85rem;">Seats</th>
                <th style="padding: 0.65rem 0.85rem; text-align: center;">Faculty Syllabus</th>
                <th style="padding: 0.65rem 0.85rem; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of filteredCourses()" style="border-bottom: 1px solid var(--border, #f1f5f9);">
                <td style="padding: 0.65rem 0.85rem;"><span class="code-badge font-mono" style="font-weight: 700; background: #e0f2fe; color: #0369a1; padding: 0.15rem 0.45rem; border-radius: 4px;">{{ c.code }}</span></td>
                <td style="padding: 0.65rem 0.85rem;"><strong>{{ c.name }}</strong></td>
                <td style="padding: 0.65rem 0.85rem;">{{ c.creditHours }} Cr</td>
                <td style="padding: 0.65rem 0.85rem;">
                  <span *ngIf="c.teacherName" style="font-weight: 600; color: #1e293b;">{{ c.teacherName }}</span>
                  <span *ngIf="!c.teacherName" class="text-muted" style="font-style: italic; color: #94a3b8;">Faculty TBA</span>
                </td>
                <td style="padding: 0.65rem 0.85rem;" class="font-mono">
                  {{ c.currentEnrollment }} / {{ c.maxSeats }}
                </td>
                <td style="padding: 0.65rem 0.85rem; text-align: center;">
                  <a *ngIf="c.syllabusUrl" [href]="getSyllabusFullUrl(c.syllabusUrl)" target="_blank" class="btn-syllabus-link" style="display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.35rem 0.65rem; background: rgba(37,99,235,0.1); color: #2563eb; border-radius: 6px; font-weight: 600; font-size: 0.78rem; text-decoration: none;" title="View Faculty Uploaded Syllabus Document">
                    <app-icon name="file-text" [size]="14" /> {{ c.syllabusFileName || 'Syllabus Doc' }}
                  </a>
                  <span *ngIf="!c.syllabusUrl" style="color: #94a3b8; font-size: 0.75rem; font-style: italic;">Not Uploaded</span>
                </td>
                <td style="padding: 0.65rem 0.85rem; text-align: center;">
                  <div style="display: inline-flex; gap: 0.35rem;">
                    <button type="button" (click)="onEditClick(c)" style="padding: 0.25rem 0.55rem; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.75rem; font-weight: 600;">Edit</button>
                    <button type="button" (click)="onDeleteClick(c)" style="padding: 0.25rem 0.55rem; background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); border-radius: 5px; cursor: pointer; font-size: 0.75rem; font-weight: 600;">Deactivate</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredCourses().length === 0">
                <td colspan="7" style="text-align: center; padding: 2rem; color: #94a3b8;">No matching courses found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Deactivate Safety Confirmation -->
    <confirmation-dialogue
      *ngIf="showDeleteConfirm()"
      [isOpen]="true"
      [title]="'Deactivate Academic Course'"
      [message]="'Are you sure you want to deactivate course ' + (deleteTarget()?.code || '') + ' — ' + (deleteTarget()?.name || '') + '?'"
      variant="danger"
      (close)="showDeleteConfirm.set(false)"
      (buttonClick)="onDeleteConfirm($event)"
    />
  `,
  styles: [`
    .page-wrapper { width: 100%; }
    .btn-syllabus-link:hover { background: rgba(37,99,235,0.2) !important; text-decoration: underline !important; }
  `]
})
export class CourseManagementListComponent implements OnInit {
  @Output() modalResult = new EventEmitter<any>();

  courses = signal<CourseResponse[]>([]);
  listPanel = signal(true);
  searchQuery = signal('');
  showDeleteConfirm = signal(false);
  deleteTarget = signal<CourseResponse | null>(null);

  private api = inject(ApiService);
  private toast = inject(ToastService);

  filteredCourses = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.courses();
    return this.courses().filter(c =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      (c.teacherName || '').toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.getAllCourses().subscribe({
      next: (data: CourseResponse[]) => this.courses.set(data),
      error: () => this.toast.error('Failed to load courses.')
    });
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  getSyllabusFullUrl(url: string | null): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url}`;
  }

  onViewClick(element: any): void {
    if (this.modalResult.observed) {
      this.modalResult.emit({ data: element, viewMode: true });
    }
  }

  onEditClick(element: any): void {
    if (this.modalResult.observed) {
      this.modalResult.emit({ data: element, isEdit: true });
    }
  }

  onDeleteClick(element: any): void {
    this.deleteTarget.set(element);
    this.showDeleteConfirm.set(true);
  }

  onDeleteConfirm(event: any): void {
    if (event.action === 'confirm' && this.deleteTarget()) {
      const target = this.deleteTarget()!;
      this.api.deactivateCourse(target.id).subscribe({
        next: () => {
          this.courses.set(this.courses().filter(c => c.id !== target.id));
          this.toast.success(`Course ${target.code} deactivated.`);
          this.showDeleteConfirm.set(false);
          this.deleteTarget.set(null);
        },
        error: () => this.toast.error('Failed to deactivate course.')
      });
    } else {
      this.showDeleteConfirm.set(false);
      this.deleteTarget.set(null);
    }
  }
}
