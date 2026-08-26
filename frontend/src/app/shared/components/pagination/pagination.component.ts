import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="pagination-container" *ngIf="totalElements > 0">
      <!-- Left: Record range info -->
      <div class="pagination-info">
        Showing <span class="numeric"><strong>{{ fromRecord }}</strong>–<strong>{{ toRecord }}</strong></span> of <span class="numeric"><strong>{{ totalElements }}</strong></span> records
      </div>

      <!-- Right: Controls (Page size selector + Page navigation) -->
      <div class="pagination-controls-wrapper">
        <!-- Page size dropdown -->
        <div class="pagination-size-selector">
          <label class="size-label" [for]="'page-size-' + uniqueId">Per page:</label>
          <div class="select-wrapper">
            <select
              [id]="'page-size-' + uniqueId"
              class="size-select"
              [value]="pageSize"
              [disabled]="disabled"
              (change)="onPageSizeChange($event)">
              <option *ngFor="let opt of pageSizeOptions" [value]="opt" [selected]="opt === pageSize">{{ opt }}</option>
            </select>
          </div>
        </div>

        <!-- Navigation buttons -->
        <div class="pagination-nav">
          <button
            type="button"
            class="page-nav-btn page-btn-prev"
            [disabled]="currentPage === 0 || disabled"
            (click)="goToPage(currentPage - 1)"
            title="Previous Page">
            <app-icon name="arrow-left" [size]="14" />
            <span>Previous</span>
          </button>

          <div class="page-pills-list" *ngIf="totalPages > 1">
            <button
              *ngFor="let p of visiblePages; track $index"
              type="button"
              class="page-pill"
              [class.active]="p === currentPage"
              [class.ellipsis]="p === -1"
              [disabled]="p === -1 || disabled"
              (click)="p !== -1 && goToPage(p)">
              {{ p === -1 ? '…' : p + 1 }}
            </button>
          </div>

          <span class="page-indicator-compact" *ngIf="totalPages <= 1">
            Page <strong>1</strong> of <strong>1</strong>
          </span>

          <button
            type="button"
            class="page-nav-btn page-btn-next"
            [disabled]="currentPage >= totalPages - 1 || disabled"
            (click)="goToPage(currentPage + 1)"
            title="Next Page">
            <span>Next</span>
            <app-icon name="arrow-right" [size]="14" />
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pagination-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      padding: 1.15rem 1.5rem;
      background: var(--bg-card);
      border-top: 1px solid var(--border);
      border-radius: 0 0 var(--radius-lg, 14px) var(--radius-lg, 14px);
      flex-wrap: wrap;
    }

    .pagination-info {
      font-size: 0.85rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 0.35rem;

      strong {
        color: var(--text-primary);
        font-weight: 700;
      }
    }

    .numeric {
      font-variant-numeric: tabular-nums;
    }

    .pagination-controls-wrapper {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
    }

    .pagination-size-selector {
      display: flex;
      align-items: center;
      gap: 0.55rem;
    }

    .size-label {
      font-size: 0.82rem;
      color: var(--text-muted);
      font-weight: 600;
    }

    .select-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
    }

    .size-select {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      color: var(--text-primary);
      border-radius: var(--radius-sm, 8px);
      padding: 0.4rem 1.8rem 0.4rem 0.75rem;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      outline: none;
      transition: all 0.2s ease;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.6rem center;
    }

    .size-select:hover:not(:disabled) {
      border-color: var(--cyan);
    }

    .size-select:focus {
      border-color: var(--cyan);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    .size-select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-nav {
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    .page-nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.45rem 0.85rem;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm, 8px);
      color: var(--text-primary);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .page-nav-btn:hover:not(:disabled) {
      background: var(--bg-elevated);
      border-color: var(--cyan);
      color: var(--cyan);
      transform: translateY(-1px);
    }

    .page-nav-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      border-color: var(--border-light);
    }

    .page-pills-list {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .page-pill {
      min-width: 32px;
      height: 32px;
      padding: 0 0.4rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-sm, 8px);
      color: var(--text-secondary);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .page-pill:hover:not(:disabled):not(.ellipsis) {
      background: var(--bg-elevated);
      color: var(--text-primary);
      border-color: var(--border);
    }

    .page-pill.active {
      background: var(--cyan);
      color: #FFFFFF;
      border-color: var(--cyan);
      font-weight: 700;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
    }

    .page-pill.ellipsis {
      cursor: default;
      color: var(--text-muted);
    }

    .page-indicator-compact {
      font-size: 0.82rem;
      color: var(--text-muted);
      padding: 0 0.5rem;
    }

    @media (max-width: 768px) {
      .pagination-container {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }
      .pagination-controls-wrapper {
        justify-content: space-between;
      }
    }
  `]
})
export class PaginationComponent {
  @Input() currentPage: number = 0; // 0-indexed
  @Input() pageSize: number = 25;
  @Input() totalElements: number = 0;
  @Input() totalPages: number = 1;
  @Input() pageSizeOptions: number[] = [25, 50, 75, 100];
  @Input() disabled: boolean = false;

  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  readonly uniqueId = Math.random().toString(36).substring(2, 9);

  get fromRecord(): number {
    if (this.totalElements === 0) return 0;
    return this.currentPage * this.pageSize + 1;
  }

  get toRecord(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i);
    }

    const pages: number[] = [];
    pages.push(0);

    if (current > 3) {
      pages.push(-1); // ellipsis
    }

    const start = Math.max(1, current - 1);
    const end = Math.min(total - 2, current + 1);

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (current < total - 4) {
      pages.push(-1); // ellipsis
    }

    if (!pages.includes(total - 1)) {
      pages.push(total - 1);
    }

    return pages;
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage && !this.disabled) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newSize = parseInt(target.value, 10);
    if (!isNaN(newSize) && newSize !== this.pageSize && !this.disabled) {
      this.pageSizeChange.emit(newSize);
    }
  }
}
