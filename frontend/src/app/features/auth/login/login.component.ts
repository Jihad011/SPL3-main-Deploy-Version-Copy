import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

// CenterPoint Shared Components
import {
  InputTextBox,
  GenericButton
} from '../../../shared';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterLink,
    IconComponent,
    InputTextBox,
    GenericButton
  ],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  form: FormGroup;
  loading = signal(false);
  error   = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private authState: AuthStateService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.authService.login(this.form.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        const routes: Record<string, string> = {
          STUDENT: '/student/dashboard',
          TEACHER: '/teacher/dashboard',
          ADMIN:   '/admin/dashboard'
        };
        this.router.navigate([routes[res.role] ?? '/auth/login']);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.detail || err.error?.message || 'Login failed. Please check your credentials.';
        this.error.set(msg);
      }
    });
  }
}
