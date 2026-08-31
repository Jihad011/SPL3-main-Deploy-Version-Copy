import { Component, input } from '@angular/core';

export type SummaryCardTone =
  | 'primary'
  | 'warning'
  | 'danger'
  | 'success'
  | 'neutral';

export type SummaryCardIcon =
  | 'calendar'
  | 'pause'
  | 'processing'
  | 'failed'
  | 'completed'
  | 'info';

export interface SummaryCardItem {
  key: string;
  label: string;
  value: number | string;
  tone?: SummaryCardTone;
  icon?: SummaryCardIcon;
  tooltip?: string;
  visible?: boolean;
}

@Component({
  selector: 'app-summary-card-strip',
  standalone: true,
  templateUrl: './summary-card-strip.html',
  styleUrl: './summary-card-strip.scss',
})
export class SummaryCardStrip {
  readonly items = input<SummaryCardItem[]>([]);
  readonly displayMode = input<'page' | 'modal'>('page');

  visibleItems(): SummaryCardItem[] {
    return this.items().filter((item) => item.visible !== false);
  }
}
