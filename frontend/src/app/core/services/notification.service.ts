import { Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';
import { interval, Subscription } from 'rxjs';

export interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  type: string;
  read?: boolean;
  isRead?: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  readonly unreadCount = signal(0);
  readonly notifications = signal<NotificationResponse[]>([]);
  private pollSub?: Subscription;

  constructor(private api: ApiService) {
    this.startPolling();
  }

  startPolling(): void {
    if (this.pollSub) return;
    this.refresh();
    // Poll every 5 seconds for fast responsive updates
    this.pollSub = interval(5000).subscribe(() => this.refresh());
  }

  stopPolling(): void {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
      this.pollSub = undefined;
    }
  }

  refresh(): void {
    this.api.getUnreadNotificationsCount().subscribe({
      next: (count: any) => this.unreadCount.set(count)
    });
    this.api.getNotifications(15).subscribe({
      next: (list: any) => this.notifications.set(list || [])
    });
  }

  markAllAsRead(): void {
    this.api.markNotificationsAsRead().subscribe({
      next: () => {
        this.unreadCount.set(0);
        this.notifications.update(list => list.map(n => ({ ...n, read: true, isRead: true })));
      }
    });
  }
}
