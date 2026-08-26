import { Component, Input } from '@angular/core';

export type IconName =
  | 'alert-triangle'
  | 'arrow-left'
  | 'arrow-right'
  | 'bell'
  | 'book-open'
  | 'calendar'
  | 'chart'
  | 'check-circle'
  | 'clipboard'
  | 'clock'
  | 'credit-card'
  | 'download'
  | 'edit'
  | 'eye'
  | 'eye-off'
  | 'filter'
  | 'graduation-cap'
  | 'history'
  | 'layout-dashboard'
  | 'list-check'
  | 'lock'
  | 'log-out'
  | 'menu'
  | 'minus'
  | 'moon'
  | 'plus'
  | 'save'
  | 'search'
  | 'settings'
  | 'sparkles'
  | 'star'
  | 'sun'
  | 'user'
  | 'users'
  | 'upload'
  | 'wallet'
  | 'x';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.width]="size"
      [attr.height]="size"
      [attr.aria-hidden]="label ? null : 'true'"
      [attr.aria-label]="label || null"
      role="img">
      @switch (name) {
        @case ('alert-triangle') {
          <path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/>
          <path d="M12 9v4"/><path d="M12 17h.01"/>
        }
        @case ('arrow-left') {
          <path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>
        }
        @case ('arrow-right') {
          <path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
        }
        @case ('bell') {
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
        }
        @case ('book-open') {
          <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2Z"/>
          <path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7Z"/>
        }
        @case ('calendar') {
          <path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/>
          <path d="M3 10h18"/>
        }
        @case ('chart') {
          <path d="M3 3v18h18"/><path d="m7 16 4-5 4 3 4-6"/>
        }
        @case ('check-circle') {
          <path d="M22 11.1V12a10 10 0 1 1-5.9-9.1"/><path d="m9 11 3 3L22 4"/>
        }
        @case ('clipboard') {
          <rect width="14" height="18" x="5" y="3" rx="2"/><path d="M9 3V1h6v2"/>
          <path d="M9 9h6"/><path d="M9 13h6"/><path d="M9 17h3"/>
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
        }
        @case ('credit-card') {
          <rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>
        }
        @case ('download') {
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        }
        @case ('edit') {
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        }
        @case ('eye') {
          <path d="M2.1 12a10.5 10.5 0 0 1 19.8 0 10.5 10.5 0 0 1-19.8 0Z"/>
          <circle cx="12" cy="12" r="3"/>
        }
        @case ('eye-off') {
          <path d="m2 2 20 20"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/>
          <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 9 4 10 8a10.6 10.6 0 0 1-2 3.8"/>
          <path d="M6.2 6.2A11.8 11.8 0 0 0 2 12c1 4 5 8 10 8 1.4 0 2.7-.3 3.8-.8"/>
        }
        @case ('filter') {
          <path d="M4 5h16"/><path d="M7 12h10"/><path d="M10 19h4"/>
        }
        @case ('graduation-cap') {
          <path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>
          <path d="M22 10v6"/>
        }
        @case ('history') {
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <path d="M12 7v5l4 2"/>
        }
        @case ('layout-dashboard') {
          <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/>
          <rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
        }
        @case ('list-check') {
          <path d="m3 7 2 2 4-4"/><path d="M11 7h10"/><path d="m3 17 2 2 4-4"/><path d="M11 17h10"/>
        }
        @case ('lock') {
          <rect width="16" height="12" x="4" y="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>
        }
        @case ('log-out') {
          <path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        }
        @case ('menu') {
          <path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>
        }
        @case ('minus') {
          <line x1="5" y1="12" x2="19" y2="12"/>
        }
        @case ('moon') {
          <path d="M20.8 14.3A8.5 8.5 0 0 1 9.7 3.2 9 9 0 1 0 20.8 14.3Z"/>
        }
        @case ('plus') {
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        }
        @case ('save') {
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/>
          <path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>
        }
        @case ('search') {
          <circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>
        }
        @case ('settings') {
          <path d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.2a2 2 0 0 1-2 0l-.1-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.1.1a2 2 0 0 1 1 1.7v.5a2 2 0 0 1-1 1.7l-.1.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.1-.1a2 2 0 0 1 2 0l.4.2a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.2a2 2 0 0 1 2 0l.1.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.1-.1a2 2 0 0 1-1-1.7v-.5a2 2 0 0 1 1-1.7l.1-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.1.1a2 2 0 0 1-2 0l-.4-.2a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2Z"/>
          <circle cx="12" cy="12" r="3"/>
        }
        @case ('sparkles') {
          <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
          <path d="M19 3v4"/><path d="M21 5h-4"/>
        }
        @case ('star') {
          <path d="m12 2 3 6 6.5 1-4.7 4.6 1.1 6.4-5.9-3.1L6.1 20l1.1-6.4L2.5 9 9 8Z"/>
        }
        @case ('sun') {
          <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/>
          <path d="m4.9 4.9 1.4 1.4"/><path d="m17.7 17.7 1.4 1.4"/><path d="M2 12h2"/>
          <path d="M20 12h2"/><path d="m6.3 17.7-1.4 1.4"/><path d="m19.1 4.9-1.4 1.4"/>
        }
        @case ('user') {
          <circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>
        }
        @case ('users') {
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/>
          <path d="M16 3.1a4 4 0 0 1 0 7.8"/>
        }
        @case ('upload') {
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
        }
        @case ('wallet') {
          <path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6"/>
          <path d="M16 13h2"/>
        }
        @case ('x') {
          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
        }
      }
    </svg>
  `,
  styles: [':host { display: inline-flex; line-height: 0; flex: 0 0 auto; }']
})
export class IconComponent {
  @Input({ required: true }) name!: IconName;
  @Input() size = 20;
  @Input() label = '';
}
