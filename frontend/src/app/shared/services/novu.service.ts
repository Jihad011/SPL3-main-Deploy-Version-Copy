// src/app/shared/services/novu.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface InAppNotification {
  _id: string;
  subject: string;
  content: string;
  data?: any;
  read: boolean;
  createdAt: string;
  redirect?: {
    url?: string;
    target?: string;
  };
}

export interface ChatMessage {
  chatId: string;
  senderUserId: string;
  receiverUserId: string;
  notificationBody: string;
  timestamp: string;
  status?: 'pending' | 'sent' | 'failed';
  clientId?: string;
}

@Injectable({ providedIn: 'root' })
export class NovuService {
  private notifications$ = new BehaviorSubject<InAppNotification[]>([]);
  private chatMessages$ = new BehaviorSubject<ChatMessage[]>([]);
  private unreadCount$ = new BehaviorSubject<number>(0);
  private backendUrl = (environment as any).apiUrl || '/api';

  public get notifications(): Observable<InAppNotification[]> {
    return this.notifications$.asObservable();
  }

  public get chatMessages(): Observable<ChatMessage[]> {
    return this.chatMessages$.asObservable();
  }

  public get unreadCount(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  async init(subscriberId: string) {
    // Local In-Memory fallback for open-source / standalone operation
  }

  markAsRead(notificationId: string): void {
    const updated = this.notifications$.value.map(n =>
      n._id === notificationId ? { ...n, read: true } : n
    );
    this.notifications$.next(updated);
    this.unreadCount$.next(updated.filter(n => !n.read).length);
  }

  markAllAsRead(): void {
    const updated = this.notifications$.value.map(n => ({ ...n, read: true }));
    this.notifications$.next(updated);
    this.unreadCount$.next(0);
  }

  sendMessage(message: ChatMessage): Observable<boolean> {
    const current = this.chatMessages$.value;
    this.chatMessages$.next([...current, message]);
    return of(true);
  }
}
