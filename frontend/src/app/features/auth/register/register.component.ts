import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

// CenterPoint Shared Components
import {
  InputTextBox,
  InputNumber,
  GenericButton
} from '../../../shared';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterLink,
    IconComponent,
    InputTextBox,
    InputNumber,
    GenericButton
  ],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  form: FormGroup;
  loading = signal(false);
  error   = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name:               ['', [Validators.required, Validators.minLength(2)]],
      email:              ['', [Validators.required, Validators.email]],
      password:           ['', [Validators.required, Validators.minLength(8)]],
      rollNumber:         ['', Validators.required],
      registrationNumber: [''],
      phone:              [''],
      batch:              [2026, [Validators.required, Validators.min(2015), Validators.max(2035)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.authService.register(this.form.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/student/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.detail || err.error?.message || 'Registration failed. Please try again.';
        this.error.set(msg);
      }
    });
  }
}
