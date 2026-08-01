import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, PublicRegisterRequest } from '../models/models';
import { AuthStateService } from './auth-state.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private state: AuthStateService) {}

  login(req: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, req).pipe(
      tap(res => this.state.saveSession(res))
    );
  }

  register(req: PublicRegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register`, req).pipe(
      tap(res => this.state.saveSession(res))
    );
  }

  logout(): void {
    this.http.post(`${this.base}/logout`, {}).subscribe({
      next: () => this.state.logout(),
      error: () => this.state.logout() // clear state even if backend fails
    });
  }
}
