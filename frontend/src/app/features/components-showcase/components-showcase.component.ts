import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

// CenterPoint Shared Components
import {
  InputTextBox,
  InputSelectOptionField,
  InputDate,
  InputNumber,
  InputAmount,
  InputAmountInWord,
  InputTextArea,
  InputSearchBox,
  InputDisplayField,
  InputFile,
  GenericButton,
  GenericModal,
  DynamicTableComponent,
  GenericSwitch,
  GenericLabel,
  ConfirmationDialogue,
  DeleteConfirmationDialogue,
  SummaryCardStrip,
  SummaryCardItem,
  SelectOptionsModel,
  DynamicTableConfig
} from '../../shared';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ThemeService, Theme } from '../../shared/services/theme.service';

@Component({
  selector: 'app-components-showcase',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    IconComponent,
    InputTextBox,
    InputSelectOptionField,
    InputDate,
    InputNumber,
    InputAmount,
    InputAmountInWord,
    InputTextArea,
    InputSearchBox,
    InputDisplayField,
    InputFile,
    GenericButton,
    GenericModal,
    DynamicTableComponent,
    GenericSwitch,
    GenericLabel,
    ConfirmationDialogue,
    DeleteConfirmationDialogue,
    SummaryCardStrip
  ],
  template: `
<div class="showcase-page">
  <!-- Top Navigation & Hero Bar -->
  <header class="showcase-header">
    <div class="showcase-header-content">
      <div class="brand-cluster">
        <div class="brand-badge">
          <app-icon name="star" [size]="20"></app-icon>
        </div>
        <div>
          <h1 class="brand-title">CenterPoint Shared Components Library</h1>
          <p class="brand-sub">Interactive Master Showcase & Design System for MIT Open Credit Management System</p>
        </div>
      </div>
      <div class="header-actions">
        <div class="theme-picker">
          <label>Theme:</label>
          <select [value]="currentTheme()" (change)="onThemeChange($event)">
            <option value="blue">Ocean Blue (Default)</option>
            <option value="MidnightBlue">Midnight Blue</option>
            <option value="emerald">Emerald Green</option>
            <option value="purple">Royal Purple</option>
            <option value="rose">Cherry Rose</option>
            <option value="dark">Dark Mode</option>
            <option value="amber">Golden Amber ☀️</option>
            <option value="cyan">Cyber Neon Cyan ⚡</option>
            <option value="teal">Nordic Teal 🌊</option>
            <option value="coral">Sunset Coral 🌅</option>
            <option value="indigo">Royal Indigo 🍇</option>
          </select>
        </div>
        <a routerLink="/admin/dashboard" class="btn-home">
          <app-icon name="arrow-left" [size]="15"></app-icon> Return to App
        </a>
      </div>
    </div>
  </header>

  <main class="showcase-body">
    <!-- 1. KPI Summary Cards Strip Showcase -->
    <section class="showcase-section">
      <div class="section-title-row">
        <div class="section-icon"><app-icon name="chart" [size]="18"></app-icon></div>
        <h2>1. KPI & Metric Summary Card Strip (<code>app-summary-card-strip</code>)</h2>
      </div>
      <p class="section-desc">Responsive summary statistics and health status metrics with configurable tones and icons.</p>
      <div class="component-card">
        <app-summary-card-strip [items]="summaryItems" displayMode="page" />
      </div>
    </section>

    <!-- 2. Form Input Fields Showcase -->
    <section class="showcase-section">
      <div class="section-title-row">
        <div class="section-icon"><app-icon name="edit" [size]="18"></app-icon></div>
        <h2>2. Reactive Form Input Controls</h2>
      </div>
      <p class="section-desc">Modern Angular 20 reactive controls with floating highlight directives, live validation, and numeric converters.</p>

      <form [formGroup]="demoForm" class="component-card form-showcase-grid">
        <div class="form-section-title">Text, Search & Numeric Controls</div>
        
        <div class="form-row-3">
          <input-text-box
            [frmGroup]="demoForm"
            controlName="fullName"
            label="Full Name"
            placeholder="e.g. Md. Ashraful Islam"
            displayMode="vertical"
          />

          <input-text-box
            [frmGroup]="demoForm"
            controlName="email"
            label="Email Address"
            placeholder="ashraf@iit.du.ac.bd"
            type="email"
            displayMode="vertical"
          />

          <input-search-box
            [frmGroup]="demoForm"
            controlName="searchCode"
            label="Fast Code Search"
            placeholder="Search roll (e.g. 26S0204)..."
          />
        </div>

        <div class="form-row-3">
          <input-number
            [frmGroup]="demoForm"
            controlName="creditHours"
            label="Credit Hours (1–6)"
            placeholder="3"
            [minValue]="1"
            [maxValue]="6"
            displayMode="vertical"
          />

          <input-date
            [frmGroup]="demoForm"
            controlName="effectiveDate"
            label="Effective Term Date"
            dateFormat="DD/MM/YYYY"
            displayMode="vertical"
          />

          <input-select-option-field
            [frmGroup]="demoForm"
            controlName="department"
            label="Department / Institute"
            [options]="departmentOptions"
            displayMode="vertical"
          />
        </div>

        <div class="form-section-title" style="margin-top: 1.5rem;">Financial Controls & BDT In-Word Generator</div>

        <div class="form-row-2">
          <input-amount
            [frmGroup]="demoForm"
            controlName="tuitionAmount"
            label="Tuition Fee (BDT)"
            placeholder="e.g. 15000"
            displayMode="vertical"
          />

          <input-amount-in-word
            [frmGroup]="demoForm"
            controlName="fineAmount"
            label="Semester Penalty Amount with Auto Word Conversion"
            placeholder="e.g. 10000"
            currency="BDT"
            displayMode="vertical"
          />
        </div>

        <div class="form-section-title" style="margin-top: 1.5rem;">Display Fields, Switch & Multiline TextArea</div>

        <div class="form-row-2">
          <input-display-field
            [frmGroup]="demoForm"
            controlName="studentStatus"
            label="Academic Standing / Dossier Status"
            displayMode="vertical"
          />

          <generic-switch
            [frmGroup]="demoForm"
            controlName="isEnrollmentActive"
            label="Open Enrollment Session Immediately"
            displayMode="vertical"
          />
        </div>

        <div style="margin-top: 1rem;">
          <input-text-area
            [frmGroup]="demoForm"
            controlName="courseSyllabus"
            label="Course Syllabus & Course Description (Markdown Supported)"
            placeholder="Enter syllabus details..."
            [rows]="3"
            displayMode="vertical"
          />
        </div>

        <div style="margin-top: 1.5rem; display: flex; gap: 0.75rem; align-items: center;">
          <generic-button
            label="Submit Validated Form"
            icon="check"
            (onClick)="submitDemoForm()"
          />
          <generic-button
            label="Reset Form Values"
            icon="refresh-cw"
            styles="background: var(--bg-elevated); color: var(--text-primary); border: 1px solid var(--border);"
            (onClick)="demoForm.reset({ creditHours: 3, tuitionAmount: 15000, fineAmount: 10000, studentStatus: 'Active Regular Enrolled (Batch 26)', isEnrollmentActive: true })"
          />
        </div>
      </form>
    </section>

    <!-- 3. Dynamic CenterPoint Generic Table Showcase -->
    <section class="showcase-section">
      <div class="section-title-row">
        <div class="section-icon"><app-icon name="list-check" [size]="18"></app-icon></div>
        <h2>3. CenterPoint Dynamic Generic Table (<code>generic-table</code>)</h2>
      </div>
      <p class="section-desc">Modular multi-section tabular layout for complex academic transcripts and financial ledgers.</p>
      
      <div class="component-card">
        <generic-table [config]="tableConfig" [showHeader]="true" [showFooter]="true" />
      </div>
    </section>

    <!-- 4. Interactive Modals & Dialogues Showcase -->
    <section class="showcase-section">
      <div class="section-title-row">
        <div class="section-icon"><app-icon name="settings" [size]="18"></app-icon></div>
        <h2>4. CenterPoint Modals & Dialogues</h2>
      </div>
      <p class="section-desc">Animated backdrop modals, confirmation dialogs with customizable tones, and deletion safety dialogs.</p>

      <div class="component-card button-showcase-cluster">
        <generic-button
          label="Open Generic Modal Dialog"
          icon="maximize"
          (onClick)="showModal.set(true)"
        />

        <generic-button
          label="Open Danger Delete Confirmation"
          icon="trash"
          styles="background: #ef4444; color: white;"
          (onClick)="showDeleteDialogue.set(true)"
        />

        <generic-button
          label="Open Success Confirmation Dialogue"
          icon="check-circle"
          styles="background: #10b981; color: white;"
          (onClick)="showConfirmDialogue.set(true)"
        />
      </div>
    </section>
  </main>

  <!-- Interactive Generic Modal -->
  <generic-modal
    [isVisible]="showModal()"
    modalTitle="CenterPoint Generic Modal Sample"
    (isVisibleChanged)="showModal.set($event)"
    (modalClosed)="showModal.set(false)"
    [showDefaultFooter]="true"
    okButtonText="Save Changes"
    cancelButtonText="Discard"
    (modalResult)="showModal.set(false)"
    (modalCancelled)="showModal.set(false)"
  >
    <div style="padding: 0.5rem 0;">
      <p style="margin-bottom: 1rem; color: var(--text-secondary);">
        This modal supports fully reactive inputs, customizable action slots, smooth animations, and escape-key dismissal.
      </p>
      <div style="background: var(--bg-elevated); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
        <generic-label labelKey="Live Status Preview: Active" />
        <p style="margin-top: 0.5rem; font-size: 0.875rem;">
          Form is valid: <strong>{{ demoForm.valid }}</strong>
        </p>
      </div>
    </div>
  </generic-modal>

  <!-- Delete Confirmation Dialogue -->
  <app-delete-confirmation-dialogue
    [isOpen]="showDeleteDialogue()"
    title="Confirm Course Deletion"
    message="Are you sure you want to deactivate and remove course MIT-501 (Advanced Software Architecture)? All associated student enrollments will be archived."
    (close)="showDeleteDialogue.set(false)"
    (buttonClick)="handleDeleteAction($event)"
  />

  <!-- Primary Confirmation Dialogue -->
  <confirmation-dialogue
    [isOpen]="showConfirmDialogue()"
    title="Publish Final Semester Grades"
    message="All 42 student marks have been verified. Publish final grades to the official academic transcript repository?"
    variant="success"
    (close)="showConfirmDialogue.set(false)"
    (buttonClick)="showConfirmDialogue.set(false)"
  />
</div>
  `,
  styles: [`
    .showcase-page {
      min-height: 100vh;
      background: var(--bg-body);
      color: var(--text-primary);
      padding-bottom: 5rem;
    }
    .showcase-header {
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
      padding: 1.5rem 2rem;
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(12px);
    }
    .showcase-header-content {
      max-width: 1300px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .brand-cluster {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .brand-badge {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: var(--grad-cyan);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0b1120;
      box-shadow: 0 4px 14px rgba(34, 211, 238, 0.35);
    }
    .brand-title {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }
    .brand-sub {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin: 0.2rem 0 0 0;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .theme-picker {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
    }
    .theme-picker select {
      background: var(--bg-elevated);
      color: var(--text-primary);
      border: 1px solid var(--border);
      padding: 0.45rem 0.8rem;
      border-radius: 8px;
      font-size: 0.85rem;
      cursor: pointer;
      outline: none;
    }
    .btn-home {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      color: var(--text-primary);
      padding: 0.45rem 0.9rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-home:hover {
      border-color: var(--accent-primary);
      color: var(--accent-primary);
    }
    .showcase-body {
      max-width: 1300px;
      margin: 2rem auto 0 auto;
      padding: 0 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
    }
    .showcase-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .section-title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .section-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(34, 211, 238, 0.12);
      color: var(--accent-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .section-title-row h2 {
      font-size: 1.15rem;
      font-weight: 700;
      margin: 0;
      color: var(--text-primary);
    }
    .section-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0;
    }
    .component-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
    .form-showcase-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .form-section-title {
      font-size: 0.875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--accent-primary);
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.4rem;
    }
    .form-row-3 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
    }
    .form-row-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 1.25rem;
    }
    .button-showcase-cluster {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }
  `]
})
export class ComponentsShowcaseComponent implements OnInit {
  demoForm: FormGroup;
  currentTheme = signal<string>('blue');
  showModal = signal<boolean>(false);
  showDeleteDialogue = signal<boolean>(false);
  showConfirmDialogue = signal<boolean>(false);

  readonly departmentOptions: SelectOptionsModel[] = [
    { key: 'IIT', value: 'Institute of Information Technology (IIT)' },
    { key: 'CSE', value: 'Computer Science & Engineering (CSE)' },
    { key: 'EEE', value: 'Electrical & Electronic Engineering (EEE)' },
    { key: 'IS', value: 'Information Systems & Technology (IS)' }
  ];

  readonly summaryItems: SummaryCardItem[] = [
    { key: 'students', label: 'Active Students', value: '1,420', tone: 'primary', icon: 'completed' },
    { key: 'courses', label: 'Enrolled Courses', value: '38', tone: 'success', icon: 'completed' },
    { key: 'dues', label: 'Pending Dues', value: '৳45,000', tone: 'warning', icon: 'pause' },
    { key: 'fines', label: 'Semester Gap Fines', value: '৳20,000', tone: 'danger', icon: 'failed' }
  ];

  readonly tableConfig: DynamicTableConfig = {
    sections: [
      {
        title: 'Spring 2026 Academic Record — Batch 26',
        rows: [
          {
            cells: [
              { label: 'Course Code', value: 'MIT-501', type: 'value', width: '20%' },
              { label: 'Course Title', value: 'Advanced Software Engineering', type: 'value', width: '35%' },
              { label: 'Credit Hours', value: '3.0 Cr', type: 'value', width: '15%' },
              { label: 'Midterm', value: '38.0 / 40', type: 'value', width: '15%' },
              { label: 'Final Score', value: '56.5 / 60', type: 'value', width: '15%' }
            ]
          },
          {
            cells: [
              { label: 'Course Code', value: 'MIT-502', type: 'value', width: '20%' },
              { label: 'Course Title', value: 'Cloud-Native Distributed Systems', type: 'value', width: '35%' },
              { label: 'Credit Hours', value: '3.0 Cr', type: 'value', width: '15%' },
              { label: 'Midterm', value: '36.5 / 40', type: 'value', width: '15%' },
              { label: 'Final Score', value: '54.0 / 60', type: 'value', width: '15%' }
            ]
          }
        ]
      }
    ]
  };

  constructor(
    private fb: FormBuilder,
    private themeService: ThemeService
  ) {
    this.demoForm = this.fb.group({
      fullName: ['Md. Jihad Hossain', Validators.required],
      email: ['jihad.hossain@iit.du.ac.bd', [Validators.required, Validators.email]],
      searchCode: ['26S0204'],
      creditHours: [3, [Validators.required, Validators.min(1), Validators.max(6)]],
      effectiveDate: [new Date()],
      department: ['IIT', Validators.required],
      tuitionAmount: [15000, Validators.required],
      fineAmount: [10000],
      studentStatus: ['Active Regular Enrolled (Batch 26)'],
      isEnrollmentActive: [true],
      courseSyllabus: ['Comprehensive curriculum covering modern cloud computing, scalable architecture, automated testing, and reactive frontend patterns.']
    });
  }

  ngOnInit(): void {
    this.currentTheme.set(this.themeService.getCurrentTheme());
  }

  onThemeChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.themeService.applyTheme(val);
    this.currentTheme.set(val);
  }

  submitDemoForm(): void {
    if (this.demoForm.invalid) {
      this.demoForm.markAllAsTouched();
      alert('Please fill all required fields in the demo form.');
      return;
    }
    alert('CenterPoint Form Validated Successfully! Data:\n' + JSON.stringify(this.demoForm.value, null, 2));
  }

  handleDeleteAction(event: any): void {
    this.showDeleteDialogue.set(false);
    alert('Course deletion action handled successfully.');
  }
}
