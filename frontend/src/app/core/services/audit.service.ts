import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface AuditLog {
  id: number;
  userId: number | null;
  userName: string;
  actionType: string;
  entityTarget: string;
  details: string;
  createdAt: string;
}

export interface PaginatedAuditLogs {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getRecentLogs(page: number = 0, size: number = 20): Observable<PaginatedAuditLogs> {
    return this.http.get<PaginatedAuditLogs>(`${this.api}/admin/audit/logs?page=${page}&size=${size}`);
  }
}
