import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

@Component({
  selector: 'input-display-field',
  imports: [ReactiveFormsModule, NgClass],
  templateUrl: './input-display-field.html',
  standalone: true,
  styleUrl: './input-display-field.scss',
})
export class InputDisplayField {
  readonly frmGroup = input.required<FormGroup>();
  readonly controlName = input.required<string>();
  readonly label = input.required<string>();
  readonly displayMode = input<'horizontal' | 'vertical'>('vertical');
  readonly isRequired = input<boolean>(false);
  readonly options = input<any[]>([]);
  readonly isSelected = input<boolean>(false);

  getValue(): string {
    const control = this.frmGroup().get(this.controlName());
    const rawValue = control?.value;

    if (!rawValue) return '-';

    // If isSelected is true and options are provided, map key to value
    if (this.isSelected() && this.options().length > 0) {
      const option = this.options().find((opt) => opt.key === rawValue);
      return option?.value || rawValue;
    }

    return rawValue;
  }
}
