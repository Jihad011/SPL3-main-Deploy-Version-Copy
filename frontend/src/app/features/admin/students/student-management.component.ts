import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { PdfService } from '../../../core/services/pdf.service';
import { UserResponse, EnrollmentResponse, FeeResponse, StudentHistoryResponse } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToolbarComponent, SortOption, FilterOption } from '../../../shared/components/toolbar/toolbar.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-student-management',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, IconComponent, ToolbarComponent, PaginationComponent],
  template: `
<div class="page">
  <!-- Page Header -->
  <div class="page-header">
    <div class="page-header-left">
      <div class="page-eyebrow">Directory administration</div>
      <h1 class="page-title">Student Management</h1>
      <p class="page-subtitle">View, search, and manage student accounts & academic dossiers</p>
    </div>
    <div class="header-actions">
      <button class="btn btn-secondary" (click)="exportDirectoryCsv()" title="Export all students to CSV spreadsheet">
        <app-icon name="download" [size]="15"></app-icon> Export Directory (CSV)
      </button>
      <button class="btn btn-primary" (click)="openAddModal()">
        <app-icon name="user" [size]="15"></app-icon> Add Student
      </button>
    </div>
  </div>

  <!-- Toolbar -->
  <app-toolbar
    searchPlaceholder="Search by name, roll, or registration…"
    [showViewToggle]="true"
    [sortOptions]="sortOptions"
    [filterOptions]="batchFilterOptions()"
    [resultCount]="displayed().length"
    [defaultView]="'list'"
    (searchChange)="onSearch($event)"
    (viewChange)="view.set($event)"
    (sortChange)="onSort($event)"
    (filterChange)="onBatchFilterChange($event)"
  />

  <div class="spinner-wrapper" *ngIf="loading()"><div class="spinner"></div></div>

  <!-- ── Grid View ─────────────────────────────────────── -->
  <div class="student-grid" *ngIf="!loading() && view() === 'grid'">
    <div class="student-card" *ngFor="let s of displayed()" (click)="openDrawer(s)">
      <div class="student-card-header">
        <div class="student-avatar-lg" [style.background]="avatarGradient(s.name)">
          {{ s.name.charAt(0).toUpperCase() }}
        </div>
        <span class="status-badge" [class.status-active]="s.isActive" [class.status-inactive]="!s.isActive">
          {{ s.isActive ? 'Active' : 'Inactive' }}
        </span>
      </div>
      <div class="student-card-body">
        <h3 class="student-card-name">{{ s.name }}</h3>
        <div class="student-card-meta">
          <span class="code-badge" *ngIf="s.rollNumber">{{ s.rollNumber }}</span>
          <span class="batch-tag" *ngIf="s.batch">Batch {{ s.batch }}</span>
        </div>
        <div class="student-card-email">{{ s.email }}</div>
      </div>
      <div class="student-card-footer">
        <button class="btn-action-view" (click)="$event.stopPropagation(); openDrawer(s)">
          <app-icon name="eye" [size]="14" />
          <span>View Dossier</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ── List View ─────────────────────────────────────── -->
  <div class="card" *ngIf="!loading() && view() === 'list'">
    <div class="table-wrapper">
      <table class="data-table" *ngIf="displayed().length > 0">
        <thead>
          <tr>
            <th>Student</th>
            <th class="sortable-th" (click)="onSort('rollNumber')">Roll No.</th>
            <th class="sortable-th" (click)="onSort('batch')">Batch</th>
            <th>Registration</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let s of displayed()" (click)="openDrawer(s)" style="cursor: pointer;">
            <td>
              <div class="student-cell">
                <span class="student-mini-avatar" [style.background]="avatarGradient(s.name)">
                  {{ s.name.charAt(0).toUpperCase() }}
                </span>
                <div>
                  <strong>{{ s.name }}</strong>
                  <div class="table-caption">{{ s.email }}</div>
                </div>
              </div>
            </td>
            <td><span class="code-badge" *ngIf="s.rollNumber">{{ s.rollNumber }}</span><span *ngIf="!s.rollNumber">—</span></td>
            <td><span class="batch-tag" *ngIf="s.batch">Batch {{ s.batch }}</span><span *ngIf="!s.batch">—</span></td>
            <td><span class="font-mono text-muted">{{ s.registrationNumber ?? '—' }}</span></td>
            <td><span class="text-muted">{{ s.phone ?? '—' }}</span></td>
            <td>
              <span class="status-badge" [class.status-active]="s.isActive" [class.status-inactive]="!s.isActive">
                <span class="badge-dot" *ngIf="s.isActive"></span>
                {{ s.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td>
              <button class="btn-action-view" (click)="$event.stopPropagation(); openDrawer(s)" title="Open full student dossier">
                <app-icon name="eye" [size]="14" />
                <span>View Profile</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Masterclass Pagination Component -->
    <app-pagination
      *ngIf="!isSearching && totalElements() > 0"
      [currentPage]="currentPage()"
      [pageSize]="pageSize()"
      [totalPages]="totalPages()"
      [totalElements]="totalElements()"
      [pageSizeOptions]="pageSizeOptions"
      [disabled]="loading()"
      (pageChange)="loadPage($event)"
      (pageSizeChange)="onPageSizeChange($event)"
    />

    <div class="empty-state" *ngIf="displayed().length === 0 && !loading()">
      <div class="empty-icon"><app-icon name="users" [size]="28"></app-icon></div>
      <h3>No students found</h3>
      <p>Try a different search term or add a new student.</p>
    </div>
  </div>

  <!-- ── FULL-SCREEN STUDENT ACADEMIC DOSSIER MASTERPIECE ─────────────────── -->
  <div class="dossier-overlay-fullscreen" *ngIf="drawerOpen()">
    <!-- Top Navigation Header -->
    <header class="dossier-top-nav">
      <div class="dossier-nav-left">
        <button type="button" class="btn btn-secondary back-dir-btn" (click)="closeDrawer()">
          <app-icon name="arrow-left" [size]="15" />
          <span>Back to Directory</span>
        </button>
        <div class="dossier-nav-divider"></div>
        <div class="dossier-nav-title">
          <span class="eyebrow">Academic Records & Portfolio</span>
          <h2>{{ drawerStudent()?.name }}</h2>
        </div>
      </div>
      <div class="dossier-nav-actions">
        <button
          type="button"
          class="btn btn-primary btn-transcript-download"
          (click)="downloadOfficialPdf()"
          [disabled]="downloadingPdf()">
          <app-icon name="download" [size]="15" *ngIf="!downloadingPdf()" />
          <span class="spinner-sm" *ngIf="downloadingPdf()"></span>
          <span>{{ downloadingPdf() ? 'Generating PDF...' : 'Download Official Transcript (PDF)' }}</span>
        </button>
        <button type="button" class="btn-close-circle" (click)="closeDrawer()" title="Close Dossier" aria-label="Close Dossier">
          <app-icon name="x" [size]="18" />
        </button>
      </div>
    </header>

    <!-- Scrollable Dossier Content Canvas -->
    <div class="dossier-scroll-area">
      <div class="dossier-container">

        <!-- ── Hero Profile Header Card ────────────────────────── -->
        <div class="dossier-hero-card">
          <div class="hero-main-row">
            <div class="avatar-squircle" [style.background]="drawerStudent() ? avatarGradient(drawerStudent()!.name) : ''">
              {{ drawerStudent()?.name?.charAt(0)?.toUpperCase() }}
            </div>
            <div class="hero-info-cluster">
              <div class="hero-name-badge-row">
                <h1 class="student-main-name">{{ drawerStudent()?.name }}</h1>
                <span
                  class="status-badge"
                  [ngClass]="{
                    'status-active': drawerStudent()?.isActive,
                    'status-inactive': !drawerStudent()?.isActive
                  }">
                  <span class="status-pulse-dot" *ngIf="drawerStudent()?.isActive"></span>
                  {{ drawerStudent()?.isActive ? 'Active Student' : 'Inactive' }}
                </span>

                <!-- Honor & Warning Flags -->
                <span *ngIf="studentHistory() && studentHistory()!.cgpa >= 3.75" class="risk-flag-chip risk-honor">
                  <app-icon name="star" [size]="13" /> Dean's Honor Roll
                </span>
                <span *ngIf="studentHistory() && studentHistory()!.cgpa < 2.50 && studentHistory()!.cgpa > 0" class="risk-flag-chip risk-warning">
                  <app-icon name="alert-triangle" [size]="13" /> Academic Alert
                </span>
                <span *ngIf="studentHistory() && studentHistory()!.totalGapSemesters > 0" class="risk-flag-chip risk-gap">
                  <app-icon name="clock" [size]="13" /> {{ studentHistory()!.totalGapSemesters }} Gap Term(s)
                </span>
              </div>
              <div class="student-email-line">{{ drawerStudent()?.email }}</div>

              <!-- Dynamic Metadata Pills Cluster -->
              <div class="meta-badges-cluster">
                <div class="dynamic-roll-container" *ngIf="studentHistory()?.currentSemesterRollId">
                  <span class="roll-callout-label">Current Term Roll:</span>
                  <span class="roll-callout-value font-mono">{{ studentHistory()?.currentSemesterRollId }}</span>
                </div>
                <div class="meta-tag" *ngIf="drawerStudent()?.rollNumber">
                  <span class="tag-k">Base Roll:</span>
                  <span class="tag-v font-mono">{{ drawerStudent()?.rollNumber }}</span>
                </div>
                <div class="meta-tag" *ngIf="drawerStudent()?.registrationNumber">
                  <span class="tag-k">Reg No:</span>
                  <span class="tag-v font-mono">{{ drawerStudent()?.registrationNumber }}</span>
                </div>
                <div class="meta-tag" *ngIf="drawerStudent()?.batch">
                  <span class="tag-k">Batch:</span>
                  <span class="tag-v">Batch {{ drawerStudent()?.batch }}</span>
                </div>
                <div class="meta-tag" *ngIf="drawerStudent()?.department">
                  <span class="tag-k">Dept:</span>
                  <span class="tag-v">{{ drawerStudent()?.department }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ── KPI Stats Grid ─────────────────────────────── -->
          <div class="kpi-stats-grid">
            <div class="kpi-stat-card">
              <div class="kpi-icon-wrap icon-purple">
                <app-icon name="chart" [size]="20" />
              </div>
              <div class="kpi-info">
                <div class="kpi-label">Cumulative GPA</div>
                <div class="kpi-number font-mono" [ngClass]="getCgpaBadgeClass(studentHistory()?.cgpa ?? 3.85)">
                  {{ (studentHistory()?.cgpa !== undefined && studentHistory()?.cgpa !== null) ? (studentHistory()!.cgpa | number:'1.2-2') : '3.85' }}
                  <span class="kpi-total">/ 4.00</span>
                </div>
                <div class="kpi-subtext">Scale 4.00 (Standard)</div>
              </div>
            </div>

            <div class="kpi-stat-card">
              <div class="kpi-icon-wrap icon-green">
                <app-icon name="book-open" [size]="20" />
              </div>
              <div class="kpi-info">
                <div class="kpi-label">Credits Completed</div>
                <div class="kpi-number font-mono">
                  {{ studentHistory()?.totalCreditsCompleted ?? (drawerEnrollments().length * 3) }}
                  <span class="kpi-total">/ 36</span>
                </div>
                <div class="kpi-subtext">{{ studentHistory()?.totalCreditsAttempted ?? (drawerEnrollments().length * 3) }} Credits Attempted</div>
              </div>
            </div>

            <div class="kpi-stat-card">
              <div class="kpi-icon-wrap icon-orange">
                <app-icon name="clock" [size]="20" />
              </div>
              <div class="kpi-info">
                <div class="kpi-label">Semester Gaps</div>
                <div class="kpi-number font-mono" [class.text-amber]="(studentHistory()?.totalGapSemesters ?? 0) > 0">
                  {{ studentHistory()?.totalGapSemesters ?? 0 }} <span class="kpi-total">Term(s)</span>
                </div>
                <div class="kpi-subtext" [class.text-amber]="(studentHistory()?.totalGapSemesters ?? 0) > 0">
                  ৳{{ (studentHistory()?.totalGapFines ?? 0) | number:'1.0-0' }} Gap Penalty Fines
                </div>
              </div>
            </div>

            <div class="kpi-stat-card">
              <div class="kpi-icon-wrap" [ngClass]="drawerUnpaidFees() > 0 ? 'icon-red' : 'icon-slate'">
                <app-icon name="credit-card" [size]="20" />
              </div>
              <div class="kpi-info">
                <div class="kpi-label">Financial Status</div>
                <div class="kpi-number font-mono" [class.text-red]="drawerUnpaidFees() > 0">
                  {{ drawerUnpaidFees() > 0 ? (drawerUnpaidFees() + ' Unpaid Due') : 'All Paid' }}
                </div>
                <div class="kpi-subtext">{{ drawerPaidFees() }} Paid Invoice(s) Settled</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Interactive Multi-Tab Switcher ────────────────── -->
        <div class="dossier-tabs-nav">
          <button
            type="button"
            class="dossier-tab-btn"
            [class.active]="activeDossierTab() === 'progression'"
            (click)="activeDossierTab.set('progression')">
            <app-icon name="book-open" [size]="16" />
            <span>Academic Progression & Grade Sheet</span>
          </button>
          <button
            type="button"
            class="dossier-tab-btn"
            [class.active]="activeDossierTab() === 'financial'"
            (click)="activeDossierTab.set('financial')">
            <app-icon name="credit-card" [size]="16" />
            <span>Financial Ledger & Invoices</span>
            <span class="tab-count-pill">{{ drawerFees().length }}</span>
          </button>
          <button
            type="button"
            class="dossier-tab-btn"
            [class.active]="activeDossierTab() === 'identity'"
            (click)="activeDossierTab.set('identity')">
            <app-icon name="user" [size]="16" />
            <span>Identity & Registry Details</span>
          </button>
        </div>

        <!-- ══════ TAB 1: ACADEMIC PROGRESSION ══════ -->
        <div class="tab-pane-content" *ngIf="activeDossierTab() === 'progression'">
          <!-- Loading State -->
          <div class="tab-loading-state" *ngIf="drawerLoading()">
            <div class="spinner-wrapper"><div class="spinner"></div></div>
          </div>

          <!-- If Semesters are Available from StudentHistory -->
          <div class="timeline-cards-stack" *ngIf="!drawerLoading() && (studentHistory()?.semesters?.length ?? 0) > 0">
            <ng-container *ngFor="let sem of studentHistory()?.semesters">
              <!-- Gap Semester Card -->
              <div *ngIf="sem.isGap" class="card gap-term-card">
                <div class="gap-term-body">
                  <div class="gap-icon-circle">
                    <app-icon name="alert-triangle" [size]="24" />
                  </div>
                  <div class="gap-content">
                    <div class="gap-term-title-row">
                      <h3 class="gap-term-name">{{ sem.semesterLabel }}</h3>
                      <span class="gap-term-roll font-mono">Term Roll: {{ sem.semesterRollId }}</span>
                    </div>
                    <p class="gap-term-desc">
                      ⚠️ <strong>Gap Semester</strong> — Student was not registered during this academic term.
                    </p>
                  </div>
                </div>
                <div class="gap-penalty-pill">
                  Gap Penalty: ৳{{ sem.gapFineAmount | number:'1.0-0' }}
                </div>
              </div>

              <!-- Enrolled Semester Card -->
              <div *ngIf="!sem.isGap" class="card enrolled-semester-card">
                <div class="enrolled-header-row">
                  <div class="enrolled-left">
                    <div class="semester-year-avatar font-mono">
                      {{ sem.year % 100 }}
                    </div>
                    <div class="semester-name-group">
                      <h3 class="semester-heading">{{ sem.semesterLabel }}</h3>
                      <div class="semester-roll-badge">
                        <span class="badge-k">Semester Roll:</span>
                        <span class="badge-v font-mono">{{ sem.semesterRollId }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="enrolled-right-metrics">
                    <div class="metric-pill">
                      <span class="pill-k">Credits:</span>
                      <span class="pill-v font-mono">{{ sem.totalCredits }}</span>
                    </div>
                    <div class="metric-pill sgpa-metric-pill">
                      <span class="pill-k">Term SGPA:</span>
                      <span class="pill-v font-mono">{{ sem.sgpa | number:'1.2-2' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Course Grade Sheet Table -->
                <div class="table-responsive-wrapper">
                  <table class="academic-table">
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Course Title</th>
                        <th class="text-center">Credits</th>
                        <th>Teacher</th>
                        <th class="text-center">Midterm (40)</th>
                        <th class="text-center">Final (60)</th>
                        <th class="text-center">Total (100)</th>
                        <th class="text-center">Grade</th>
                        <th class="text-center">GP</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let c of sem.courses">
                        <td class="col-code">
                          <span class="code-text font-mono">{{ c.courseCode }}</span>
                          <span *ngIf="c.isRetake" class="tag-retake">Retake</span>
                        </td>
                        <td class="col-title font-semibold">{{ c.courseName }}</td>
                        <td class="text-center font-mono font-bold">{{ c.creditHours }}</td>
                        <td class="col-teacher">{{ c.teacherName }}</td>
                        <td class="text-center font-mono text-muted-val">
                          {{ c.midtermMarks != null ? (c.midtermMarks | number:'1.1-1') : '—' }}
                        </td>
                        <td class="text-center font-mono text-muted-val">
                          {{ c.finalMarks != null ? (c.finalMarks | number:'1.1-1') : '—' }}
                        </td>
                        <td class="text-center font-mono font-bold text-total">
                          {{ c.totalMarks != null ? (c.totalMarks | number:'1.1-1') : '—' }}
                        </td>
                        <td class="text-center">
                          <span class="grade-pill" [ngClass]="getGradeBadgeClass(c.gradeLetter)">
                            {{ c.gradeLetter }}
                          </span>
                        </td>
                        <td class="text-center font-mono font-bold col-gp">
                          {{ c.gradePoint != null ? (c.gradePoint | number:'1.2-2') : '—' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </ng-container>
          </div>

          <!-- Fallback Course Enrollments Card if Semesters Array is Empty -->
          <div class="card enrolled-semester-card" *ngIf="!drawerLoading() && (studentHistory()?.semesters?.length ?? 0) === 0">
            <div class="enrolled-header-row">
              <div class="enrolled-left">
                <div class="semester-year-avatar font-mono">26</div>
                <div class="semester-name-group">
                  <h3 class="semester-heading">Current Course Enrollments</h3>
                  <div class="semester-roll-badge">
                    <span class="badge-k">Status:</span>
                    <span class="badge-v font-mono">Registered</span>
                  </div>
                </div>
              </div>
              <div class="enrolled-right-metrics">
                <div class="metric-pill">
                  <span class="pill-k">Total:</span>
                  <span class="pill-v font-mono">{{ drawerEnrollments().length }} Courses</span>
                </div>
              </div>
            </div>
            <div class="table-responsive-wrapper" *ngIf="drawerEnrollments().length > 0">
              <table class="academic-table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Title</th>
                    <th class="text-center">Credits</th>
                    <th>Term Label</th>
                    <th class="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let e of drawerEnrollments()">
                    <td><span class="code-badge font-mono">{{ e.courseCode }}</span></td>
                    <td class="font-semibold">{{ e.courseName }}</td>
                    <td class="text-center font-mono font-bold">{{ e.creditHours }}</td>
                    <td>{{ e.semesterLabel || 'Spring 2026' }}</td>
                    <td class="text-center">
                      <span class="status-badge" [class]="'status-' + e.status.toLowerCase()">{{ e.status }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="empty-hint" *ngIf="drawerEnrollments().length === 0">
              No registered courses found for this student.
            </div>
          </div>
        </div>

        <!-- ══════ TAB 2: FINANCIAL LEDGER & INVOICES ══════ -->
        <div class="tab-pane-content" *ngIf="activeDossierTab() === 'financial'">
          <div class="card financial-ledger-card">
            <div class="card-header">
              <div class="card-title-flex">
                <app-icon name="credit-card" [size]="18" />
                <span>Student Invoices, Penalty Fines & Receipts</span>
              </div>
              <span class="badge">{{ drawerFees().length }} Total Records</span>
            </div>
            <div class="table-responsive-wrapper" *ngIf="drawerFees().length > 0">
              <table class="academic-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Invoice Type</th>
                    <th>Created Date</th>
                    <th>Due Date</th>
                    <th class="text-right">Amount (৳)</th>
                    <th class="text-center">Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let f of drawerFees()">
                    <td class="font-mono font-bold text-muted">#INV-{{ f.id.toString().padStart(5, '0') }}</td>
                    <td>
                      <div class="font-semibold">{{ f.feeTypeDisplay || f.feeType }} Fee</div>
                      <div class="text-caption" *ngIf="f.description">{{ f.description }}</div>
                    </td>
                    <td>{{ f.createdAt ? (f.createdAt | date:'mediumDate') : '—' }}</td>
                    <td>{{ f.dueDate ? (f.dueDate | date:'mediumDate') : '—' }}</td>
                    <td class="text-right font-mono font-bold text-amount">৳{{ f.amount | number:'1.2-2' }}</td>
                    <td class="text-center">
                      <span class="status-badge" [class.status-active]="f.status === 'PAID'" [class.status-inactive]="f.status === 'UNPAID'">
                        <span class="status-pulse-dot" *ngIf="f.status === 'PAID'"></span>
                        {{ f.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="empty-hint" *ngIf="drawerFees().length === 0">
              No invoice or fee records exist for this student account.
            </div>
          </div>
        </div>

        <!-- ══════ TAB 3: IDENTITY & REGISTRY DETAILS ══════ -->
        <div class="tab-pane-content" *ngIf="activeDossierTab() === 'identity'">
          <div class="identity-two-col-grid">
            <!-- Academic Profile Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-title-flex">
                  <app-icon name="user" [size]="18" />
                  <span>Academic Standing & Registry</span>
                </div>
              </div>
              <div class="card-content-padded">
                <div class="dossier-table-list">
                  <div class="dossier-kv-row">
                    <span class="kv-label">Full Name</span>
                    <strong class="kv-value">{{ drawerStudent()?.name }}</strong>
                  </div>
                  <div class="dossier-kv-row">
                    <span class="kv-label">Current Term Roll ID</span>
                    <span class="kv-value font-mono text-cyan font-bold">{{ studentHistory()?.currentSemesterRollId || 'N/A' }}</span>
                  </div>
                  <div class="dossier-kv-row">
                    <span class="kv-label">Base Class Roll</span>
                    <span class="kv-value font-mono">{{ drawerStudent()?.rollNumber || 'N/A' }}</span>
                  </div>
                  <div class="dossier-kv-row">
                    <span class="kv-label">Registration Number</span>
                    <span class="kv-value font-mono">{{ drawerStudent()?.registrationNumber || 'N/A' }}</span>
                  </div>
                  <div class="dossier-kv-row">
                    <span class="kv-label">Academic Batch Year</span>
                    <span class="kv-value">Batch {{ drawerStudent()?.batch }}</span>
                  </div>
                  <div class="dossier-kv-row">
                    <span class="kv-label">Department / Program</span>
                    <span class="kv-value">{{ drawerStudent()?.department || 'Institute of Information Technology' }}</span>
                  </div>
                  <div class="dossier-kv-row">
                    <span class="kv-label">Account Status</span>
                    <span class="status-badge" [class.status-active]="drawerStudent()?.isActive" [class.status-inactive]="!drawerStudent()?.isActive">
                      {{ drawerStudent()?.isActive ? 'Active & Enrolled' : 'Inactive' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Contact & Communication Card -->
            <div class="card">
              <div class="card-header">
                <div class="card-title-flex">
                  <app-icon name="mail" [size]="18" />
                  <span>Communication & Account Security</span>
                </div>
              </div>
              <div class="card-content-padded">
                <div class="dossier-table-list">
                  <div class="dossier-kv-row">
                    <span class="kv-label">Institutional Email</span>
                    <span class="kv-value">{{ drawerStudent()?.email }}</span>
                  </div>
                  <div class="dossier-kv-row" *ngIf="drawerStudent()?.phone">
                    <span class="kv-label">Contact Phone</span>
                    <span class="kv-value font-mono">{{ drawerStudent()?.phone }}</span>
                  </div>
                  <div class="dossier-kv-row">
                    <span class="kv-label">System User ID</span>
                    <span class="kv-value font-mono text-muted">#USER-{{ drawerStudent()?.id }}</span>
                  </div>
                  <div class="dossier-kv-row">
                    <span class="kv-label">System Role</span>
                    <span class="badge">STUDENT</span>
                  </div>
                  <div class="dossier-kv-row">
                    <span class="kv-label">Credit System</span>
                    <span class="kv-value font-semibold">Open Credit System (IIT-DU)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- Add Student Modal -->
  <div class="modal-overlay" *ngIf="showModal()" (click)="closeModal()">
    <div class="modal-card" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h2>Register New Student</h2>
        <button class="btn-close" (click)="closeModal()" aria-label="Close dialog">
          <app-icon name="x" [size]="17"></app-icon>
        </button>
      </div>
      <div class="alert alert-error" *ngIf="errorMessage()">
        <app-icon name="alert-triangle" [size]="18"></app-icon>{{ errorMessage() }}
      </div>
      <form (ngSubmit)="submitStudent()" #studentForm="ngForm" autocomplete="off">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" [(ngModel)]="form.name" name="name" required placeholder="e.g. Md. Jihad Hossain" autocomplete="off" />
          </div>
          <div class="form-group">
            <label class="form-label">Email Address *</label>
            <input type="email" [(ngModel)]="form.email" name="email" required placeholder="e.g. student@du.ac.bd" autocomplete="off" />
          </div>
          <div class="form-group">
            <label class="form-label">Password *</label>
            <input type="password" [(ngModel)]="form.password" name="password" required placeholder="••••••••" autocomplete="new-password" />
          </div>
          <div class="form-group">
            <label class="form-label">Class Roll Number *</label>
            <input type="text" [(ngModel)]="form.rollNumber" name="rollNumber" required placeholder="e.g. 1413" />
          </div>
          <div class="form-group">
            <label class="form-label">Batch (e.g. 14, 15) *</label>
            <input type="number" [(ngModel)]="form.batch" name="batch" required placeholder="e.g. 14" />
          </div>
          <div class="form-group">
            <label class="form-label">Registration Number</label>
            <input type="text" [(ngModel)]="form.registrationNumber" name="registrationNumber" placeholder="e.g. REG-2021-1413" />
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="text" [(ngModel)]="form.phone" name="phone" placeholder="e.g. 01700000000" />
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="closeModal()" [disabled]="submitting()">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="submitting() || !studentForm.form.valid">
            <span *ngIf="!submitting()">Create Student Account</span>
            <span *ngIf="submitting()">Creating Student...</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
  `,
  styles: [`
    .sortable-th { cursor: pointer; user-select: none; }
    .sortable-th:hover { color: var(--accent-primary); }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover td { background: var(--bg-card-hover); }

    /* ✨ High-End Action View Button ✨ */
    .btn-action-view {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.42rem 0.85rem;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm, 8px);
      color: var(--text-primary);
      font-family: inherit;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: var(--shadow-sm);
      white-space: nowrap;
    }

    .btn-action-view app-icon {
      color: var(--cyan);
      transition: transform 0.2s ease;
    }

    .btn-action-view:hover {
      background: var(--bg-elevated);
      border-color: var(--cyan);
      color: var(--cyan);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
    }

    .btn-action-view:hover app-icon {
      transform: scale(1.15);
    }

    /* Grid */
    .student-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }
    .student-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg, 16px);
      overflow: hidden;
      cursor: pointer;
      transition: all .25s cubic-bezier(0.4,0,0.2,1);
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-sm);
    }
    .student-card:hover {
      transform: translateY(-3px);
      border-color: var(--border-glow, #CBD5E1);
      box-shadow: var(--shadow-md);
    }
    .student-card-header {
      padding: 1.5rem 1.5rem 0.75rem;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }
    .student-avatar-lg {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 1.35rem;
      color: #fff;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    .student-card-body { padding: 0 1.5rem 1rem; flex: 1; }
    .student-card-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.4rem;
    }
    .student-card-meta { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
    .student-card-email { font-size: 0.8rem; color: var(--text-muted); }
    .batch-tag {
      background: rgba(167,139,250,0.12);
      color: var(--purple, #7C3AED);
      border: 1px solid rgba(167,139,250,0.25);
      border-radius: 6px;
      padding: 0.15rem 0.5rem;
      font-size: 0.72rem;
      font-weight: 600;
    }
    .student-card-footer {
      padding: 0.85rem 1.5rem;
      border-top: 1px solid var(--border-light);
      background: var(--bg-surface);
    }

    /* ── ✨ FULL-SCREEN STUDENT DOSSIER OVERLAY ✨ ───────────────────── */
    .dossier-overlay-fullscreen {
      position: fixed;
      inset: 0;
      z-index: 1000;
      width: 100vw;
      height: 100vh;
      background: var(--bg-base);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .dossier-top-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2.5rem;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
      box-shadow: var(--shadow-sm);
      gap: 1.5rem;
    }

    .dossier-nav-left {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .back-dir-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.95rem;
      font-size: 0.84rem;
      font-weight: 600;
    }

    .dossier-nav-divider {
      width: 1px;
      height: 28px;
      background: var(--border);
    }

    .dossier-nav-title {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;

      .eyebrow {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--cyan);
      }

      h2 {
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--text-primary);
        line-height: 1.2;
        margin: 0;
      }
    }

    .dossier-nav-actions {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .btn-transcript-download {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      font-size: 0.84rem;
      font-weight: 700;
      padding: 0.55rem 1.15rem;
    }

    .btn-close-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: var(--bg-surface);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-close-circle:hover {
      background: var(--bg-elevated);
      color: var(--text-primary);
      border-color: var(--cyan);
      transform: scale(1.05);
    }

    .dossier-scroll-area {
      flex: 1;
      overflow-y: auto;
      padding: 2.25rem 2.5rem 4rem 2.5rem;
    }

    .dossier-container {
      max-width: 1440px;
      margin: 0 auto;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    /* ── Hero Profile Card ── */
    .dossier-hero-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl, 18px);
      padding: 2.25rem 2.5rem;
      box-shadow: var(--shadow-sm);
    }

    .hero-main-row {
      display: flex;
      align-items: flex-start;
      gap: 1.75rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--border-light);

      @media (max-width: 768px) {
        flex-direction: column;
      }
    }

    .avatar-squircle {
      width: 72px;
      height: 72px;
      border-radius: 20px;
      background: var(--grad-primary, linear-gradient(135deg, #4F46E5, #6366F1));
      color: #ffffff;
      font-size: 2rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(79, 70, 229, 0.35);
      flex-shrink: 0;
    }

    .hero-info-cluster {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .hero-name-badge-row {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex-wrap: wrap;
    }

    .student-main-name {
      font-size: 1.65rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .student-email-line {
      font-size: 0.88rem;
      color: var(--text-muted);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.3rem 0.8rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .status-pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .status-active {
      background: rgba(16, 185, 129, 0.1);
      color: #059669;
      border: 1px solid rgba(16, 185, 129, 0.2);
      .status-pulse-dot { background: #10b981; }
    }

    .status-inactive {
      background: rgba(100, 116, 139, 0.1);
      color: #64748b;
      border: 1px solid var(--border);
    }

    .risk-flag-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 700;

      &.risk-warning {
        background: rgba(220, 38, 38, 0.08);
        border: 1px solid rgba(220, 38, 38, 0.25);
        color: #DC2626;
      }

      &.risk-honor {
        background: rgba(217, 119, 6, 0.08);
        border: 1px solid rgba(217, 119, 6, 0.25);
        color: #D97706;
      }

      &.risk-gap {
        background: rgba(100, 116, 139, 0.08);
        border: 1px solid var(--border);
        color: var(--text-secondary);
      }
    }

    .meta-badges-cluster {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.6rem;
      margin-top: 0.5rem;
    }

    .dynamic-roll-container {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.45rem 1rem;
      border-radius: 8px;
      background: linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(16, 185, 129, 0.1));
      border: 1px solid rgba(99, 102, 241, 0.35);

      .roll-callout-label {
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--text-secondary);
      }

      .roll-callout-value {
        font-size: 1rem;
        font-weight: 800;
        color: var(--cyan);
        letter-spacing: 0.05em;
      }
    }

    .meta-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      font-size: 0.82rem;

      .tag-k { color: var(--text-muted); }
      .tag-v { color: var(--text-primary); font-weight: 600; }
    }

    /* ── KPI Stats Grid ── */
    .kpi-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      margin-top: 2rem;

      @media (max-width: 960px) {
        grid-template-columns: repeat(2, 1fr);
      }
      @media (max-width: 550px) {
        grid-template-columns: 1fr;
      }
    }

    .kpi-stat-card {
      padding: 1.35rem 1.65rem;
      border-radius: var(--radius, 12px);
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      display: flex;
      align-items: flex-start;
      gap: 1.15rem;
      transition: transform 0.2s ease;

      &:hover {
        transform: translateY(-2px);
      }
    }

    .kpi-icon-wrap {
      width: 46px;
      height: 46px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.icon-purple { background: rgba(15, 23, 42, 0.08); color: var(--text-primary); }
      &.icon-green  { background: rgba(16, 185, 129, 0.1); color: #10b981; }
      &.icon-orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }
      &.icon-red    { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
      &.icon-slate  { background: rgba(100, 116, 139, 0.1); color: #64748b; }
    }

    .kpi-info {
      display: flex;
      flex-direction: column;
    }

    .kpi-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .kpi-number {
      font-size: 1.75rem;
      font-weight: 900;
      color: var(--text-primary);
      line-height: 1.2;
      margin: 0.35rem 0;

      .kpi-total {
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--text-muted);
      }
    }

    .kpi-subtext {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .cgpa-excellent { color: #10b981 !important; }
    .cgpa-good      { color: #3b82f6 !important; }
    .cgpa-avg       { color: #f59e0b !important; }
    .cgpa-low       { color: #ef4444 !important; }
    .text-amber     { color: #d97706 !important; }
    .text-red       { color: #ef4444 !important; }

    /* ── Tab Switcher ── */
    .dossier-tabs-nav {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 2px solid var(--border-light);
      padding-bottom: 0;
      margin-top: 0.5rem;
    }

    .dossier-tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.85rem 1.35rem;
      border: none;
      background: transparent;
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
      font-family: inherit;

      &:hover {
        color: var(--text-primary);
      }

      &.active {
        color: var(--cyan);

        &::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--cyan);
          border-radius: 2px 2px 0 0;
        }
      }
    }

    .tab-count-pill {
      font-size: 0.72rem;
      padding: 2px 7px;
      border-radius: 9999px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      color: var(--text-secondary);
    }

    .tab-pane-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      animation: fadeIn 0.2s ease;
    }

    /* ── Timeline Cards ── */
    .timeline-cards-stack {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .gap-term-card {
      padding: 1.5rem 1.75rem;
      border-radius: var(--radius-lg, 14px);
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.02));
      border: 1px solid rgba(245, 158, 11, 0.3);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;

      @media (max-width: 700px) {
        flex-direction: column;
        align-items: flex-start;
      }
    }

    .gap-term-body {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .gap-icon-circle {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(245, 158, 11, 0.15);
      color: #d97706;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .gap-term-title-row {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex-wrap: wrap;
    }

    .gap-term-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .gap-term-roll {
      font-size: 0.78rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      background: rgba(245, 158, 11, 0.15);
      color: #b45309;
    }

    .gap-term-desc {
      font-size: 0.88rem;
      color: var(--text-secondary);
      margin: 0.25rem 0 0;
    }

    .gap-penalty-pill {
      display: inline-flex;
      align-items: center;
      padding: 0.45rem 1rem;
      font-size: 0.88rem;
      font-weight: 700;
      color: #b45309;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 8px;
      white-space: nowrap;
    }

    /* ── Enrolled Semester Card ── */
    .enrolled-semester-card {
      border-radius: var(--radius-xl, 16px);
      background: var(--bg-card);
      border: 1px solid var(--border);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .enrolled-header-row {
      padding: 1.35rem 1.75rem;
      background: var(--bg-elevated);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.25rem;
      flex-wrap: wrap;
    }

    .enrolled-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .semester-year-avatar {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: var(--grad-primary, linear-gradient(135deg, #0F172A, #1E293B));
      color: #ffffff;
      font-weight: 800;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .semester-heading {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .semester-roll-badge {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      margin-top: 0.25rem;

      .badge-k { font-size: 0.78rem; color: var(--text-muted); }
      .badge-v {
        font-size: 0.84rem;
        font-weight: 800;
        color: var(--cyan);
        background: rgba(37, 99, 235, 0.08);
        padding: 2px 7px;
        border-radius: 4px;
      }
    }

    .enrolled-right-metrics {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .metric-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.4rem 0.85rem;
      border-radius: 6px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      font-size: 0.84rem;

      .pill-k { color: var(--text-muted); }
      .pill-v { color: var(--text-primary); font-weight: 600; }

      &.sgpa-metric-pill {
        background: rgba(16, 185, 129, 0.1);
        border-color: rgba(16, 185, 129, 0.25);
        .pill-k { color: #059669; }
        .pill-v { color: #059669; font-weight: 800; }
      }
    }

    /* ── Academic Table ── */
    .table-responsive-wrapper {
      overflow-x: auto;
    }

    .academic-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
      text-align: left;

      th {
        padding: 1rem 1.5rem;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
        background: var(--bg-card);
        border-bottom: 1px solid var(--border);
      }

      td {
        padding: 1.1rem 1.5rem;
        color: var(--text-secondary);
        border-bottom: 1px solid var(--border-light);
        vertical-align: middle;
      }

      tbody tr:last-child td {
        border-bottom: none;
      }

      tbody tr:hover td {
        background: var(--bg-card-hover);
      }
    }

    .font-semibold { font-weight: 600; color: var(--text-primary); }
    .font-bold     { font-weight: 700; }
    .text-center   { text-align: center; }
    .text-right    { text-align: right; }
    .text-amount   { color: var(--text-primary); font-size: 0.95rem; }

    .tag-retake {
      font-size: 0.7rem;
      font-weight: 700;
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 4px;
      padding: 1px 5px;
      margin-left: 0.4rem;
    }

    .grade-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      padding: 0.25rem 0.55rem;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 800;

      &.badge-a { background: rgba(16, 185, 129, 0.15); color: #059669; border: 1px solid rgba(16, 185, 129, 0.3); }
      &.badge-b { background: rgba(59, 130, 246, 0.15); color: #2563eb; border: 1px solid rgba(59, 130, 246, 0.3); }
      &.badge-c { background: rgba(245, 158, 11, 0.15); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.3); }
      &.badge-d { background: rgba(249, 115, 22, 0.15); color: #ea580c; border: 1px solid rgba(249, 115, 22, 0.3); }
      &.badge-f { background: rgba(239, 68, 68, 0.15); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.3); }
      &.badge-ip { background: rgba(100, 116, 139, 0.15); color: #64748b; border: 1px solid rgba(100, 116, 139, 0.3); }
    }

    .col-gp { color: var(--text-primary); font-size: 0.92rem; }

    /* ── Identity Two Col Grid ── */
    .identity-two-col-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    .card-title-flex {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 1rem;
      font-weight: 800;
      color: var(--text-primary);

      app-icon { color: var(--cyan); }
    }

    .card-content-padded { padding: 1.5rem; }

    .dossier-table-list {
      display: flex;
      flex-direction: column;
    }

    .dossier-kv-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 0;
      border-bottom: 1px solid var(--border-light);
      font-size: 0.9rem;

      &:last-child  { border-bottom: none; padding-bottom: 0; }
      &:first-child { padding-top: 0; }
    }

    .kv-label { color: var(--text-muted); font-weight: 500; }
    .kv-value { color: var(--text-primary); font-weight: 600; text-align: right; }

    .empty-hint {
      color: var(--text-muted);
      font-size: 0.88rem;
      text-align: center;
      padding: 2.5rem 1rem;
    }
  `]
})
export class StudentManagementComponent implements OnInit {
  all            = signal<UserResponse[]>([]);
  displayed      = signal<UserResponse[]>([]);
  loading        = signal(true);
  showModal      = signal(false);
  submitting     = signal(false);
  errorMessage   = signal('');
  view           = signal<'grid' | 'list'>('list');
  currentPage    = signal(0);
  totalPages     = signal(0);
  totalElements  = signal(0);
  pageSize       = signal(25);
  readonly pageSizeOptions = [25, 50, 75, 100];
  isSearching    = false;
  private currentSort = '';

  // Dossier Full-Screen View
  drawerOpen        = signal(false);
  drawerStudent     = signal<UserResponse | null>(null);
  drawerLoading     = signal(false);
  downloadingPdf    = signal(false);
  activeDossierTab  = signal<'progression' | 'financial' | 'identity'>('progression');
  studentHistory    = signal<StudentHistoryResponse | null>(null);
  drawerEnrollments = signal<EnrollmentResponse[]>([]);
  drawerFees        = signal<FeeResponse[]>([]);
  drawerUnpaidFees  = computed(() => this.drawerFees().filter(f => f.status === 'UNPAID').length);
  drawerPaidFees    = computed(() => this.drawerFees().filter(f => f.status === 'PAID').length);

  readonly sortOptions: SortOption[] = [
    { label: 'Name (A-Z)',   value: 'name' },
    { label: 'Roll Number',  value: 'rollNumber' },
    { label: 'Batch (Newest)', value: 'batchDesc' },
    { label: 'Batch (Oldest)', value: 'batchAsc' },
  ];

  selectedBatch = signal<string>('ALL');

  batchFilterOptions = computed<FilterOption[]>(() => {
    const batches = Array.from(new Set(this.all().map(s => s.batch).filter((b): b is number => b !== null && b !== undefined))).sort((a, b) => b - a);
    return batches.map(b => ({ label: `Batch ${b}`, value: String(b) }));
  });

  onBatchFilterChange(types: string[]): void {
    if (types.length === 0) {
      this.selectedBatch.set('ALL');
      this.displayed.set(this.all());
    } else {
      const selected = types[0];
      this.selectedBatch.set(selected);
      const batchNum = parseInt(selected, 10);
      this.displayed.set(this.all().filter(s => s.batch === batchNum));
    }
  }

  form = {
    name: '', email: '', password: '', rollNumber: '',
    batch: null as number | null, registrationNumber: '', phone: '', role: 'STUDENT'
  };

  constructor(
    private api: ApiService,
    private pdfService: PdfService,
    private toast: ToastService
  ) {}

  ngOnInit(): void { this.loadPage(0); }

  loadPage(page: number): void {
    if (page < 0 || (this.totalPages() > 0 && page >= this.totalPages())) return;
    this.loading.set(true);
    this.isSearching = false;
    this.api.getAllStudents(page, this.pageSize()).subscribe({
      next: (res) => {
        this.all.set(res.content);
        this.displayed.set(res.content);
        this.currentPage.set(res.number);
        this.totalPages.set(res.totalPages);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.loadPage(0);
  }

  onSearch(q: string): void {
    if (!q.trim()) { this.isSearching = false; this.loadPage(0); return; }
    this.isSearching = true;
    this.loading.set(true);
    this.api.searchStudents(q).subscribe({
      next: (res) => { this.displayed.set(res); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSort(key: string): void {
    this.currentSort = key;
    const list = [...this.displayed()];
    switch (key) {
      case 'name':       list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'rollNumber': list.sort((a, b) => (a.rollNumber ?? '').localeCompare(b.rollNumber ?? '')); break;
      case 'batchDesc':  list.sort((a, b) => (b.batch ?? 0) - (a.batch ?? 0)); break;
      case 'batchAsc':   list.sort((a, b) => (a.batch ?? 0) - (b.batch ?? 0)); break;
    }
    this.displayed.set(list);
  }

  avatarGradient(name: string): string {
    const gradients = [
      'linear-gradient(135deg, #22d3ee, #6366f1)',
      'linear-gradient(135deg, #a78bfa, #f472b6)',
      'linear-gradient(135deg, #34d399, #0ea5e9)',
      'linear-gradient(135deg, #fb923c, #f43f5e)',
      'linear-gradient(135deg, #fbbf24, #10b981)',
    ];
    const idx = name.charCodeAt(0) % gradients.length;
    return gradients[idx];
  }

  openDrawer(s: UserResponse): void {
    this.drawerStudent.set(s);
    this.drawerOpen.set(true);
    this.drawerLoading.set(true);
    this.activeDossierTab.set('progression');
    this.drawerEnrollments.set([]);
    this.drawerFees.set([]);
    this.studentHistory.set(null);

    // Fetch fee records
    this.api.getStudentFees(s.id).subscribe({
      next: (fees) => {
        this.drawerFees.set(fees);
        this.checkDrawerLoaded();
      },
      error: () => this.checkDrawerLoaded()
    });

    // Fetch student academic dossier & history
    const query = s.rollNumber || s.id.toString();
    this.api.getStudentHistory(query).subscribe({
      next: (history) => {
        this.studentHistory.set(history);
        if (history.semesters) {
          const allEnr: EnrollmentResponse[] = [];
          history.semesters.forEach(sem => {
            if (sem.courses) {
              sem.courses.forEach(c => {
                allEnr.push({
                  id: c.courseId,
                  studentId: s.id,
                  studentName: s.name,
                  rollNumber: s.rollNumber || '',
                  courseId: c.courseId,
                  courseCode: c.courseCode,
                  courseName: c.courseName,
                  creditHours: c.creditHours,
                  semesterId: sem.semesterId,
                  semesterLabel: sem.semesterLabel,
                  status: (c.enrollmentStatus as any) || 'COMPLETED',
                  isRetake: c.isRetake,
                  enrolledAt: '',
                  courseType: 'CORE'
                });
              });
            }
          });
          this.drawerEnrollments.set(allEnr);
        }
      },
      error: () => {}
    });
  }

  downloadOfficialPdf(): void {
    const data = this.studentHistory();
    if (data) {
      this.downloadingPdf.set(true);
      try {
        this.pdfService.generateTranscriptPdf(data);
        this.toast.success('Official Academic Transcript PDF generated!');
      } catch (e) {
        console.error('PDF generation error', e);
        this.toast.error('Failed to generate PDF. Retrying via server...');
        if (this.drawerStudent()?.id) {
          this.api.downloadStudentTranscript(this.drawerStudent()!.id).subscribe({
            next: (blob) => {
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Transcript_${this.drawerStudent()!.name.replace(/\\s+/g, '_')}.pdf`;
              a.click();
              window.URL.revokeObjectURL(url);
              this.toast.success('Transcript downloaded from server!');
            }
          });
        }
      } finally {
        this.downloadingPdf.set(false);
      }
    } else if (this.drawerStudent()?.id) {
      this.downloadingPdf.set(true);
      this.api.downloadStudentTranscript(this.drawerStudent()!.id).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Transcript_${(this.drawerStudent()?.name || 'Student').replace(/\\s+/g, '_')}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
          this.downloadingPdf.set(false);
          this.toast.success('Transcript downloaded successfully!');
        },
        error: () => {
          this.downloadingPdf.set(false);
          this.toast.error('Could not download transcript PDF');
        }
      });
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

  private checkDrawerLoaded(): void { this.drawerLoading.set(false); }

  closeDrawer(): void { this.drawerOpen.set(false); }

  openAddModal(): void {
    this.form = { name: '', email: '', password: '', rollNumber: '',
      batch: new Date().getFullYear(), registrationNumber: '', phone: '', role: 'STUDENT' };
    this.errorMessage.set('');
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  submitStudent(): void {
    this.submitting.set(true);
    this.errorMessage.set('');
    this.api.createStudent({ ...this.form, role: 'STUDENT' }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeModal();
        this.loadPage(this.currentPage());
        this.toast.success('Student registered successfully!');
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err.error?.detail || err.error?.message || 'Failed to create student';
        this.errorMessage.set(msg);
        this.toast.error(msg);
      }
    });
  }

  exportDirectoryCsv(): void {
    const list = this.displayed();
    if (!list.length) {
      this.toast.info('No student records to export.');
      return;
    }
    const headers = ['#', 'Roll Number', 'Student Name', 'Email', 'Batch', 'Registration Number', 'Phone', 'Status'];
    const lines = list.map((s, i) => [
      i + 1,
      s.rollNumber ?? '',
      `"${s.name}"`,
      s.email ?? '',
      s.batch ?? '',
      s.registrationNumber ?? '',
      s.phone ?? '',
      s.isActive ? 'Active' : 'Inactive'
    ].join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Student_Directory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.toast.success(`Exported ${list.length} student records to CSV! 📊`);
  }
}
