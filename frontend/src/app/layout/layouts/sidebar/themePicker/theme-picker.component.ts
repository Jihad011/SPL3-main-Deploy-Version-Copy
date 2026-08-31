import { Component, OnInit, Renderer2, Inject, HostListener, ElementRef, ViewChild } from '@angular/core';
import { DOCUMENT, NgForOf, NgIf } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MatIcon } from '@angular/material/icon';
import { MatRipple } from '@angular/material/core';
import { Theme, ThemeService } from '../../../../shared/services/theme.service';

@Component({
  selector: 'app-theme-picker',
  standalone: true,
  imports: [NgIf, NgForOf, MatIcon, MatRipple],
  template: `
    <div class="theme-picker-container" #themePickerContainer>
      <!-- Theme Picker Button -->
      <button
        #themePickerBtn
        class="theme-picker-btn"
        [class.active]="isOpen"
        (click)="togglePicker($event)"
        [attr.aria-expanded]="isOpen"
        [attr.aria-haspopup]="true"
        aria-label="Open theme picker"
        matRipple>
        <mat-icon>palette</mat-icon>
        <span class="btn-text">Theme</span>
        <mat-icon class="dropdown-arrow" [class.rotated]="isOpen">
          keyboard_arrow_down
        </mat-icon>
      </button>

      <!-- Theme Picker Dropdown -->
      <div
        #dropdown
        class="theme-picker-dropdown"
        [class.visible]="isOpen"
        [@slideInOut]="isOpen ? 'in' : 'out'"
        [attr.aria-hidden]="!isOpen"
        role="menu">

        <div class="dropdown-header">
          <h3>Choose Theme</h3>
          <button
            (click)="closePicker()"
            class="close-btn"
            aria-label="Close theme picker"
            tabindex="0">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="themes-grid" role="group" aria-label="Theme options">
          <button
            *ngFor="let theme of themes; trackBy: trackByThemeId"
            class="theme-option"
            [class.selected]="selectedTheme === theme.id"
            (click)="selectTheme(theme)"
            [attr.aria-pressed]="selectedTheme === theme.id"
            [attr.aria-label]="'Select ' + theme.name + ' theme'"
            role="menuitem"
            type="button">

            <div class="theme-preview" [style.background]="getThemeGradient(theme)">
              <div class="preview-circles">
                <div class="circle primary" [style.background]="theme.primary"></div>
                <div class="circle secondary" [style.background]="theme.secondary"></div>
                <div class="circle accent" [style.background]="theme.accent"></div>
              </div>

              <mat-icon
                *ngIf="selectedTheme === theme.id"
                class="selected-icon"
                aria-hidden="true">
                check_circle
              </mat-icon>
            </div>

            <div class="theme-info flex flex-wrap lg:flex-nowrap items-center">
              <mat-icon class="theme-icon" [attr.aria-hidden]="true">{{ theme.icon }}</mat-icon>
              <span class="theme-name ml-2">{{ theme.name }}</span>
            </div>
          </button>
        </div>

        <div class="dropdown-footer">
          <button
            class="reset-btn"
            (click)="resetToDefault()"
            type="button"
            aria-label="Reset theme to default">
            <mat-icon>refresh</mat-icon>
            Reset to Default
          </button>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div
      class="backdrop"
      *ngIf="isOpen"
      (click)="closePicker()"
      [@fadeInOut]="isOpen ? 'in' : 'out'">
    </div>
  `,
  styles: [`
    .theme-picker-container {
      position: relative;
      z-index: 1000;
      display: inline-block;
      width: 100%;
    }

    .theme-picker-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      font-family: inherit;
      font-size: 13px;
      width: 100%;
      position: relative;
    }

    .theme-picker-btn:hover {
      background: #f8fafc;
      border-color: var(--theme-primary, #3b82f6);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .theme-picker-btn:focus {
      outline: 2px solid var(--theme-primary, #3b82f6);
      outline-offset: 2px;
    }

    .theme-picker-btn.active {
      background: var(--theme-primary, #3b82f6);
      color: white;
      border-color: var(--theme-primary, #3b82f6);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .dropdown-arrow {
      margin-left: auto;
      transition: transform 0.2s ease;
      font-size: 18px;
    }

    .dropdown-arrow.rotated {
      transform: rotate(180deg);
    }

    .theme-picker-dropdown {
      position: fixed;
      bottom: calc(100% + 8px);
      right: 0;
      width: 280px;
      background: white;
      border-radius: 12px;
      box-shadow:
        0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04),
        0 0 0 1px rgba(0, 0, 0, 0.05);
      border: 1px solid #e5e7eb;
      overflow: hidden;
      transform-origin: bottom right;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      max-height: 400px;
      overflow-y: auto;
      z-index: 15000;
    }

    .theme-picker-dropdown.visible {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;
    }

    .dropdown-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      border-bottom: 1px solid #e5e7eb;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    }

    .dropdown-header h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #374151;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      color: #6b7280;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      background: rgba(0,0,0,0.05);
      color: #374151;
      transform: scale(1.1);
    }

    .themes-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      padding: 16px;
    }

    .theme-option {
      cursor: pointer;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.2s ease;
      border: 2px solid transparent;
      background: none;
      padding: 0;
      display: block;
      width: 100%;
    }

    .theme-option:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba(0,0,0,0.1);
      border-color: rgba(0,0,0,0.1);
    }

    .theme-option.selected {
      border-color: var(--theme-primary, #3b82f6);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
    }

    .theme-preview {
      height: 65px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .preview-circles {
      display: flex;
      gap: 6px;
      z-index: 1;
    }

    .circle {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.4);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: transform 0.2s ease;
    }

    .selected-icon {
      position: absolute;
      top: 6px;
      right: 6px;
      color: white;
      background: rgba(0,0,0,0.2);
      border-radius: 50%;
      padding: 2px;
      font-size: 18px;
      backdrop-filter: blur(4px);
    }

    .theme-info {
      padding: 5px;
      background: white;
      display: flex;
      align-items: center;
      gap: 4px;
      border-top: 1px solid rgba(0,0,0,0.05);
    }

    .theme-icon {
      color: #6b7280;
      font-size: 16px;
      flex-shrink: 0;
    }

    .theme-name {
      font-size: 12px;
      font-weight: 500;
      color: #374151;
      text-align: left;
    }

    .dropdown-footer {
      padding: 12px 16px;
      border-top: 1px solid #e5e7eb;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    }

    .reset-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      padding: 8px 12px;
      background: none;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      color: #6b7280;
      transition: all 0.2s ease;
      justify-content: center;
    }

    .reset-btn:hover {
      background: rgba(0,0,0,0.02);
      border-color: var(--theme-primary, #3b82f6);
      color: var(--theme-primary, #3b82f6);
      transform: translateY(-1px);
    }

    .backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.1);
      z-index: 999;
      opacity: 0;
    }
  `],
  animations: [
    trigger('slideInOut', [
      state('in', style({
        opacity: 1,
        transform: 'scale(1) translateY(0)',
        visibility: 'visible'
      })),
      state('out', style({
        opacity: 0,
        transform: 'scale(0.95) translateY(-10px)',
        visibility: 'hidden'
      })),
      transition('out => in', [
        animate('200ms cubic-bezier(0.25, 0.8, 0.25, 1)')
      ]),
      transition('in => out', [
        animate('150ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ])
    ]),
    trigger('fadeInOut', [
      state('in', style({ opacity: 1 })),
      state('out', style({ opacity: 0 })),
      transition('out => in', animate('150ms ease-out')),
      transition('in => out', animate('100ms ease-in'))
    ])
  ]
})
export class ThemePickerComponent implements OnInit {
  @ViewChild('themePickerContainer', { static: true }) themePickerContainer!: ElementRef;
  @ViewChild('dropdown', { static: true }) dropdown!: ElementRef;

  isOpen = false;
  selectedTheme = 'blue';
  themes: Theme[] = [];

  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
    private elementRef: ElementRef,
    private themeService: ThemeService
  ) {
    this.themes = this.themeService.themes;
  }

  ngOnInit() {
    this.selectedTheme = this.themeService.getCurrentTheme();
    this.themeService.currentTheme$.subscribe(themeId => {
      this.selectedTheme = themeId;
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.closePicker();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (this.isOpen) {
      if (event.key === 'Escape') {
        this.closePicker();
        event.preventDefault();
      }
    }
  }

  togglePicker(event?: Event) {
    if (event) event.stopPropagation();
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      setTimeout(() => {
        this.adjustDropdownPosition();
      }, 0);
    }
  }

  closePicker() {
    this.isOpen = false;
  }

  selectTheme(theme: Theme) {
    this.themeService.applyTheme(theme.id);
    this.closePicker();
  }

  resetToDefault() {
    this.themeService.resetTheme();
    this.closePicker();
  }

  trackByThemeId(index: number, theme: Theme): string {
    return theme.id;
  }

  getThemeGradient(theme: Theme): string {
    return `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`;
  }

  private adjustDropdownPosition() {
    if (!this.dropdown?.nativeElement) return;
    const dropdown = this.dropdown.nativeElement;
    const container = this.themePickerContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const dropdownWidth = 280;
    const dropdownHeight = 350;

    let left = rect.left;
    let top = rect.top - dropdownHeight - 8;

    if (left + dropdownWidth > viewportWidth - 16) {
      left = viewportWidth - dropdownWidth - 16;
    }
    if (top < 16) {
      top = rect.bottom + 8;
    }

    this.renderer.setStyle(dropdown, 'position', 'fixed');
    this.renderer.setStyle(dropdown, 'top', `${top}px`);
    this.renderer.setStyle(dropdown, 'left', `${left}px`);
    this.renderer.setStyle(dropdown, 'right', 'auto');
    this.renderer.setStyle(dropdown, 'bottom', 'auto');
  }
}
