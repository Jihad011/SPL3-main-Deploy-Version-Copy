import {
  Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

export interface SortOption { label: string; value: string; }
export interface FilterOption { label: string; value: string; group?: string; }

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="toolbar">
  <!-- Search -->
  <div class="toolbar-search" *ngIf="showSearch">
    <div class="search-wrapper">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        #searchInput
        type="text"
        class="search-input"
        [placeholder]="searchPlaceholder"
        [(ngModel)]="searchValue"
        (ngModelChange)="onSearchInput($event)"
        [attr.aria-label]="searchPlaceholder"
        id="toolbar-search-input"
      />
      <button *ngIf="searchValue" class="search-clear" (click)="clearSearch()" aria-label="Clear search">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <span class="search-shortcut" *ngIf="!searchValue">⌃K</span>
    </div>
  </div>

  <!-- Sort Dropdown -->
  <div class="toolbar-dropdown" *ngIf="sortOptions.length > 0">
    <button class="toolbar-btn" (click)="toggleSort()" [class.active]="sortOpen()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18M7 12h10M11 18h2"/>
      </svg>
      Sort
      <span class="active-badge" *ngIf="selectedSort">1</span>
    </button>
    <div class="dropdown-panel" *ngIf="sortOpen()">
      <button class="dropdown-item" *ngFor="let opt of sortOptions"
              [class.selected]="selectedSort === opt.value"
              (click)="selectSort(opt.value)">
        {{ opt.label }}
        <svg *ngIf="selectedSort === opt.value" width="14" height="14" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Filter Dropdown -->
  <div class="toolbar-dropdown" *ngIf="filterOptions.length > 0">
    <button class="toolbar-btn" (click)="toggleFilter()" [class.active]="filterOpen()">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>
      Filter
      <span class="active-badge" *ngIf="selectedFilters.size > 0">{{ selectedFilters.size }}</span>
    </button>
    <div class="dropdown-panel filter-panel" *ngIf="filterOpen()">
      <button class="dropdown-item" *ngFor="let opt of filterOptions"
              [class.selected]="selectedFilters.has(opt.value)"
              (click)="toggleFilterItem(opt.value)">
        <span class="filter-check">
          <svg *ngIf="selectedFilters.has(opt.value)" width="12" height="12" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </span>
        {{ opt.label }}
      </button>
      <div class="dropdown-footer" *ngIf="selectedFilters.size > 0">
        <button class="clear-filters-btn" (click)="clearFilters()">Clear filters</button>
      </div>
    </div>
  </div>

  <div class="toolbar-spacer"></div>

  <!-- Result count -->
  <span class="toolbar-count" *ngIf="resultCount >= 0">
    {{ resultCount }} result{{ resultCount !== 1 ? 's' : '' }}
  </span>

  <!-- View Toggle -->
  <div class="view-toggle" *ngIf="showViewToggle">
    <button class="view-btn" [class.active]="currentView() === 'grid'"
            (click)="setView('grid')" title="Grid view" aria-label="Grid view">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    </button>
    <button class="view-btn" [class.active]="currentView() === 'list'"
            (click)="setView('list')" title="List view" aria-label="List view">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/>
        <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
        <line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    </button>
  </div>
</div>
  `,
  styles: [`
    .toolbar {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.875rem 0;
      flex-wrap: wrap;
    }
    .toolbar-search { flex: 1; min-width: 200px; max-width: 440px; }
    .search-wrapper {
      position: relative; display: flex; align-items: center;
    }
    .search-icon {
      position: absolute; left: 0.875rem; color: var(--text-muted);
      pointer-events: none;
    }
    .search-input {
      width: 100%; padding: 0.6rem 2.5rem 0.6rem 2.5rem;
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 10px; color: var(--text-primary); font-size: 0.875rem;
      transition: border-color .2s, box-shadow .2s;
      font-family: inherit;
    }
    .search-input:focus {
      outline: none; border-color: var(--accent-primary);
      box-shadow: 0 0 0 3px rgba(34,211,238,0.12);
    }
    .search-clear {
      position: absolute; right: 0.875rem; background: none; border: none;
      color: var(--text-muted); cursor: pointer; padding: 0.25rem;
      border-radius: 4px; display: flex; align-items: center; transition: color .2s;
    }
    .search-clear:hover { color: var(--text-primary); }
    .search-shortcut {
      position: absolute; right: 0.75rem;
      font-size: 0.7rem; color: var(--text-muted);
      background: var(--bg-elevated); border: 1px solid var(--border);
      border-radius: 4px; padding: 0.1rem 0.35rem; font-family: monospace;
    }
    .toolbar-dropdown { position: relative; }
    .toolbar-btn {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.575rem 0.875rem;
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 10px; color: var(--text-secondary); font-size: 0.825rem;
      cursor: pointer; transition: all .2s; font-family: inherit; font-weight: 500;
      white-space: nowrap;
    }
    .toolbar-btn:hover, .toolbar-btn.active {
      border-color: var(--border-glow); color: var(--accent-primary);
      background: rgba(34,211,238,0.05);
    }
    .active-badge {
      background: var(--accent-primary); color: var(--bg-base);
      border-radius: 50%; width: 16px; height: 16px;
      font-size: 0.65rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .dropdown-panel {
      position: absolute; top: calc(100% + 6px); left: 0; z-index: 100;
      background: var(--bg-elevated); border: 1px solid var(--border);
      border-radius: 12px; padding: 0.375rem;
      box-shadow: 0 20px 48px rgba(0,0,0,0.4);
      min-width: 180px;
      animation: dropDown .15s ease;
    }
    .filter-panel { min-width: 200px; }
    @keyframes dropDown {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .dropdown-item {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; padding: 0.55rem 0.875rem; border: none;
      background: none; color: var(--text-secondary); font-size: 0.85rem;
      cursor: pointer; border-radius: 8px; transition: all .15s;
      text-align: left; font-family: inherit; gap: 0.5rem;
    }
    .dropdown-item:hover { background: var(--bg-card-hover); color: var(--text-primary); }
    .dropdown-item.selected { color: var(--accent-primary); background: rgba(34,211,238,0.08); }
    .filter-check {
      width: 14px; height: 14px; border: 1.5px solid var(--border);
      border-radius: 3px; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; color: var(--accent-primary);
    }
    .dropdown-item.selected .filter-check { border-color: var(--accent-primary); background: rgba(34,211,238,0.15); }
    .dropdown-footer { padding: 0.375rem 0.5rem 0.25rem; border-top: 1px solid var(--border); margin-top: 0.25rem; }
    .clear-filters-btn {
      background: none; border: none; color: var(--accent-red);
      font-size: 0.8rem; cursor: pointer; padding: 0.25rem; font-family: inherit;
    }
    .toolbar-spacer { flex: 1; }
    .toolbar-count { font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; }
    .view-toggle {
      display: flex; gap: 2px;
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 10px; padding: 3px;
    }
    .view-btn {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border: none; background: none;
      color: var(--text-muted); cursor: pointer; border-radius: 7px; transition: all .2s;
    }
    .view-btn.active { background: var(--accent-primary); color: var(--bg-base); }
    .view-btn:not(.active):hover { background: var(--bg-elevated); color: var(--text-primary); }
  `]
})
export class ToolbarComponent implements OnInit, OnDestroy {
  @Input() showSearch = true;
  @Input() showViewToggle = true;
  @Input() searchPlaceholder = 'Search...';
  @Input() sortOptions: SortOption[] = [];
  @Input() filterOptions: FilterOption[] = [];
  @Input() resultCount = -1;
  @Input() defaultView: 'grid' | 'list' = 'list';

  @Output() searchChange = new EventEmitter<string>();
  @Output() viewChange   = new EventEmitter<'grid' | 'list'>();
  @Output() sortChange   = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<string[]>();

  searchValue = '';
  selectedSort = '';
  selectedFilters = new Set<string>();

  sortOpen   = signal(false);
  filterOpen = signal(false);
  currentView: ReturnType<typeof signal<'grid' | 'list'>>;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor() {
    this.currentView = signal<'grid' | 'list'>('list');
  }

  ngOnInit(): void {
    this.currentView.set(this.defaultView);
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(v => this.searchChange.emit(v));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('toolbar-search-input')?.focus();
    }
    if (e.key === 'Escape') {
      this.sortOpen.set(false);
      this.filterOpen.set(false);
    }
  }

  @HostListener('document:click', ['$event'])
  onOutsideClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.toolbar-dropdown')) {
      this.sortOpen.set(false);
      this.filterOpen.set(false);
    }
  }

  onSearchInput(val: string): void { this.searchSubject.next(val); }
  clearSearch(): void { this.searchValue = ''; this.searchSubject.next(''); }
  toggleSort(): void { this.sortOpen.update(v => !v); this.filterOpen.set(false); }
  toggleFilter(): void { this.filterOpen.update(v => !v); this.sortOpen.set(false); }

  selectSort(val: string): void {
    this.selectedSort = this.selectedSort === val ? '' : val;
    this.sortChange.emit(this.selectedSort);
    this.sortOpen.set(false);
  }

  toggleFilterItem(val: string): void {
    if (this.selectedFilters.has(val)) this.selectedFilters.delete(val);
    else this.selectedFilters.add(val);
    this.filterChange.emit([...this.selectedFilters]);
  }

  clearFilters(): void {
    this.selectedFilters.clear();
    this.filterChange.emit([]);
  }

  setView(v: 'grid' | 'list'): void {
    this.currentView.set(v);
    this.viewChange.emit(v);
  }
}
