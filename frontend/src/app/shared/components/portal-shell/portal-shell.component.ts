import { DOCUMENT } from '@angular/common';
import { Component, Inject, Input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { NotificationService } from '../../../core/services/notification.service';
import { IconComponent, IconName } from '../icon/icon.component';

export interface PortalNavItem {
  label: string;
  link: string;
  icon: IconName;
}

@Component({
  selector: 'app-portal-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IconComponent, DatePipe],
  template: `
    <div class="layout" [class.sidebar-open]="menuOpen()">
      <header class="mobile-topbar">
        <button
          type="button"
          class="icon-button mobile-menu-button"
          (click)="toggleMenu()"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="portal-navigation"
          aria-label="Open navigation">
          <app-icon [name]="menuOpen() ? 'x' : 'menu'" [size]="21" />
        </button>
        <div class="mobile-brand">
          <span class="mobile-brand-mark"><app-icon [name]="brandIcon" [size]="19" /></span>
          <span>
            <strong>MIT Open Credit Management System</strong>
            <small>{{ portalLabel }}</small>
          </span>
        </div>
        <button type="button" class="icon-button" (click)="cycleTheme()" [title]="currentThemeInfo.name" aria-label="Switch color theme">
          <span class="theme-color-dot" [style.background]="currentThemeInfo.dotColor"></span>
        </button>
      </header>

      <button
        type="button"
        class="sidebar-overlay"
        (click)="closeMenu()"
        aria-label="Close navigation">
      </button>

      <aside class="sidebar" id="portal-navigation">
        <div class="sidebar-brand">
          <div class="brand-icon"><app-icon [name]="brandIcon" [size]="22" /></div>
          <div>
            <div class="brand-name">MIT Open Credit Management System</div>
            <div class="brand-sub">{{ portalLabel }}</div>
          </div>
        </div>

        <div class="sidebar-section-label">Navigation</div>
        <nav class="sidebar-nav" aria-label="Primary navigation">
          @for (item of navItems; track item.link) {
            <a
              [routerLink]="item.link"
              routerLinkActive="active"
              class="nav-item"
              (click)="closeMenu()">
              <span class="nav-icon"><app-icon [name]="item.icon" [size]="18" /></span>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <button type="button" class="theme-toggle" (click)="cycleTheme()" title="Click to cycle masterpiece themes">
            <span class="theme-color-dot" [style.background]="currentThemeInfo.dotColor"></span>
            <span style="flex: 1; text-align: left; font-weight: 600;">{{ currentThemeInfo.name }}</span>
            <app-icon name="sparkles" [size]="15" style="color:var(--cyan);" />
          </button>
          <div class="user-card" style="position: relative;">
            <div class="user-avatar">{{ userInitial }}</div>
            <div class="user-copy" style="flex: 1;">
              <div class="user-name">{{ auth.user()?.name }}</div>
              <div class="user-role">{{ userMeta }}</div>
            </div>
            <button class="icon-button notification-bell" (click)="toggleNotifications()" [class.has-unread]="notif.unreadCount() > 0">
              <app-icon name="bell" [size]="18" />
              <span class="unread-badge" *ngIf="notif.unreadCount() > 0">{{ notif.unreadCount() }}</span>
            </button>
            
            <!-- Notifications Dropdown -->
            <div class="notifications-dropdown glass-card" *ngIf="showNotifications()">
              <div class="notif-header">
                <strong>Notifications</strong>
                <button class="mark-read-btn" (click)="notif.markAllAsRead()" *ngIf="notif.unreadCount() > 0">Mark read</button>
              </div>
              <div class="notif-list">
                @for (n of notif.notifications(); track n.id) {
                  <div class="notif-item" [class.unread]="!n.read">
                    <div class="notif-icon">
                      <app-icon [name]="getNotifIcon(n.type)" [size]="16" />
                    </div>
                    <div class="notif-content">
                      <div class="notif-title">{{ n.title }}</div>
                      <div class="notif-message">{{ n.message }}</div>
                      <div class="notif-time">{{ n.createdAt | date:'short' }}</div>
                    </div>
                  </div>
                }
                @if (notif.notifications().length === 0) {
                  <div class="notif-empty">No notifications yet.</div>
                }
              </div>
            </div>
          </div>
          <button class="btn-logout" type="button" (click)="auth.logout()">
            <app-icon name="log-out" [size]="17" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main class="main-content">
        <ng-content />
      </main>
    </div>
  `
})
export class PortalShellComponent {
  @Input({ required: true }) portalLabel!: string;
  @Input({ required: true }) brandIcon!: IconName;
  @Input({ required: true }) navItems: PortalNavItem[] = [];
  @Input({ required: true }) role!: 'student' | 'teacher' | 'admin';

  readonly menuOpen = signal(false);
  readonly currentTheme = signal<'royal-blue' | 'emerald-mint' | 'amethyst-white'>('royal-blue');
  readonly showNotifications = signal(false);

  readonly themeOptions = [
    { id: 'royal-blue' as const, name: 'Royal Oxford', dotColor: '#2563EB' },
    { id: 'emerald-mint' as const, name: 'Ivy Emerald', dotColor: '#059669' },
    { id: 'amethyst-white' as const, name: 'Imperial Amethyst', dotColor: '#7C3AED' }
  ];

  get currentThemeInfo() {
    return this.themeOptions.find(t => t.id === this.currentTheme()) ?? this.themeOptions[0];
  }

  constructor(
    public auth: AuthStateService,
    public notif: NotificationService,
    @Inject(DOCUMENT) private document: Document
  ) {
    const saved = this.document.defaultView?.localStorage.getItem('mit-theme');
    if (saved === 'emerald-mint' || saved === 'amethyst-white' || saved === 'royal-blue') {
      this.currentTheme.set(saved);
    } else {
      this.currentTheme.set('royal-blue');
    }
    this.applyTheme();
  }

  ngOnInit() {
    this.notif.startPolling();
  }

  ngOnDestroy() {
    this.notif.stopPolling();
  }

  toggleNotifications(): void {
    this.showNotifications.update(v => !v);
  }

  getNotifIcon(type: string): IconName {
    if (type === 'FEE_CREATED' || type === 'FEE_PAID') return 'credit-card';
    if (type === 'COURSE_ASSIGNED') return 'book-open';
    if (type === 'GRADE_PUBLISHED') return 'check-circle';
    return 'bell';
  }

  get userInitial(): string {
    return (this.auth.user()?.name || this.role || 'U').charAt(0).toUpperCase();
  }

  get userMeta(): string {
    const user = this.auth.user();
    if (this.role === 'student') return user?.rollNumber ? `Roll ${user.rollNumber}` : 'Student';
    if (this.role === 'teacher') return user?.designation || 'Teacher';
    return 'Administrator';
  }

  toggleMenu(): void {
    this.menuOpen.update(value => !value);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  cycleTheme(): void {
    const order: ('royal-blue' | 'emerald-mint' | 'amethyst-white')[] = ['royal-blue', 'emerald-mint', 'amethyst-white'];
    const currentIndex = order.indexOf(this.currentTheme());
    const nextTheme = order[(currentIndex + 1) % order.length];
    this.currentTheme.set(nextTheme);
    this.document.defaultView?.localStorage.setItem('mit-theme', nextTheme);
    this.applyTheme();
  }

  private applyTheme(): void {
    this.document.documentElement.dataset['theme'] = this.currentTheme();
  }
}
