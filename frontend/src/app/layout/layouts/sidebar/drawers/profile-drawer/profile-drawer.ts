import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthStateService } from '../../../../../core/services/auth-state.service';

@Component({
  selector: 'app-profile-drawer',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="h-full overflow-y-auto pb-16 profile-drawer bg-gradient-to-br from-[var(--theme-background)] to-gray-50 p-4 space-y-4">
      <!-- User Profile Card -->
      <div class="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-gray-200/80 shadow-md">
        <div class="flex items-center space-x-3.5 mb-3">
          <div class="relative">
            <div
              class="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md"
              [style.background]="avatarGradient(user()?.name || 'User')"
            >
              {{ (user()?.name || 'U').charAt(0).toUpperCase() }}
            </div>
            <div class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="font-bold text-gray-800 text-sm truncate">
              {{ user()?.name || 'Academic User' }}
            </h3>
            <p class="text-xs text-gray-500 truncate font-mono">
              {{ user()?.email || 'user@university.edu' }}
            </p>
            <span class="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono">
              {{ user()?.role }}
            </span>
          </div>
        </div>
      </div>

      <!-- Quick Info Meta Card -->
      <div class="bg-white/90 rounded-2xl p-4 border border-gray-200/80 shadow-sm space-y-2 text-xs">
        <div class="flex justify-between items-center py-1 border-b border-gray-100" *ngIf="user()?.rollNumber">
          <span class="text-gray-500 font-medium">Roll Number</span>
          <span class="font-bold font-mono text-gray-800">{{ user()?.rollNumber }}</span>
        </div>
        <div class="flex justify-between items-center py-1 border-b border-gray-100" *ngIf="user()?.registrationNumber">
          <span class="text-gray-500 font-medium">Registration</span>
          <span class="font-bold font-mono text-gray-800">{{ user()?.registrationNumber }}</span>
        </div>
        <div class="flex justify-between items-center py-1 border-b border-gray-100" *ngIf="user()?.designation">
          <span class="text-gray-500 font-medium">Designation</span>
          <span class="font-bold text-gray-800">{{ user()?.designation }}</span>
        </div>
        <div class="flex justify-between items-center py-1">
          <span class="text-gray-500 font-medium">Portal Status</span>
          <span class="font-bold text-emerald-600 flex items-center gap-1">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Active & Authenticated
          </span>
        </div>
      </div>
    </div>
  `
})
export class ProfileDrawer {
  private authState = inject(AuthStateService);

  user = this.authState.user;

  avatarGradient(name: string): string {
    const colors = [
      'linear-gradient(135deg, #0284c7, #0369a1)',
      'linear-gradient(135deg, #7c3aed, #6d28d9)',
      'linear-gradient(135deg, #059669, #047857)',
      'linear-gradient(135deg, #d97706, #b45309)'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }
}
