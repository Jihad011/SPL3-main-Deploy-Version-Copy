import { Component, input, signal, effect, OnInit } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgClass, CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

type Option = { key: any; value: string };

@Component({
  selector: 'input-display-field',
  imports: [ReactiveFormsModule, NgClass, CommonModule, MatTooltipModule],
  templateUrl: './input-display-field.html',
  standalone: true,
  styleUrl: './input-display-field.scss',
})
export class InputDisplayField implements OnInit {
  readonly frmGroup = input.required<FormGroup>();
  readonly controlName = input.required<string>();
  readonly label = input.required<string>();
  readonly displayMode = input<'horizontal' | 'vertical'>('vertical');
  readonly isRequired = input<boolean>(false);
  readonly isSelectable = input<boolean>(false);
  readonly options = input<Option[] | null>(null);

  // Mapping state
  displayText = signal<string>('');
  private _lastControlValue: any = '';
  private _lastOptionsRef: Option[] | null = null;

  constructor() {
    effect(() => {
      // Only process options if selectable mode is enabled
      if (!this.isSelectable()) return;

      const opts = this.options() || [];
      const optionsChanged = this._lastOptionsRef !== opts;
      this._lastOptionsRef = opts;

      if (optionsChanged) {
        this._syncDisplayFromValue(this._lastControlValue);
      }
    });
  }

  ngOnInit(): void {
    if (!this.isSelectable()) return;

    const control = this.frmGroup().get(this.controlName());
    if (!control) return;

    control.valueChanges.subscribe((val) => {
      this._lastControlValue = val ?? '';
      this._syncDisplayFromValue(this._lastControlValue);
    });

    // Initial sync
    this._lastControlValue = control.value ?? '';
    this._syncDisplayFromValue(this._lastControlValue);
  }

  private _syncDisplayFromValue(val: any) {
    const opts = this.options() || [];
    const selected = opts.find((o) => o.key === val);
    if (selected) {
      this.displayText.set(selected.value);
    } else {
      this.displayText.set('');
    }
  }

  getValue(): string {
    // If selectable mode is enabled and we have a mapped display text, use it
    if (this.isSelectable() && this.displayText()) {
      return this.displayText();
    }
    // Otherwise, display the raw control value
    const control = this.frmGroup().get(this.controlName());
    return control?.value || '-';
  }
}
