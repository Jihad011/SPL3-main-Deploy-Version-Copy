import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
<div class="auth-container">
  <div class="auth-card" style="text-align:center">
    <div style="font-size:4rem">🚫</div>
    <h1>Access Denied</h1>
    <p>You don't have permission to view this page.</p>
    <a routerLink="/auth/login" class="btn-primary" style="display:inline-block;margin-top:1rem">
      Back to Login
    </a>
  </div>
</div>`
})
export class UnauthorizedComponent {}
