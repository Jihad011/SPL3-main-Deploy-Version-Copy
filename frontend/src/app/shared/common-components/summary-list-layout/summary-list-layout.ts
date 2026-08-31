import { Component, input } from '@angular/core';
import {
  SummaryCardItem,
  SummaryCardStrip,
} from '../summary-card-strip/summary-card-strip';

@Component({
  selector: 'app-summary-list-layout',
  standalone: true,
  imports: [SummaryCardStrip],
  templateUrl: './summary-list-layout.html',
  styleUrl: './summary-list-layout.scss',
})
export class SummaryListLayout {
  readonly title = input('');
  readonly subtitle = input('');
  readonly displayMode = input<'page' | 'modal'>('page');
  readonly showHeader = input(true);
  readonly summaryItems = input<SummaryCardItem[]>([]);
}
