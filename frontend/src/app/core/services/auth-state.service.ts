import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthResponse, Role } from '../models/models';

const USER_KEY  = 'credit_mgmt_user';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  // Angular 18 signals — reactive without a Subject
  private _user = signal<AuthResponse | null>(this.loadUser());

  readonly user  = this._user.asReadonly();

  constructor(private router: Router) {}

  saveSession(auth: AuthResponse): void {
    localStorage.setItem(USER_KEY, JSON.stringify(auth));
    this._user.set(auth);
  }

  clearSession(): void {
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }

  isLoggedIn(): boolean { return !!this._user(); }
  getRole(): Role | null { return this._user()?.role ?? null; }
  getUserId(): number | null { return this._user()?.userId ?? null; }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  private loadUser(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
