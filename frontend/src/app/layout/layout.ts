import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './layouts/navbar/navbar';
import { Sidebar } from './layouts/sidebar/sidebar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Navbar, Sidebar],
  template: `
    <div [class.blur-screen]="isBlurred" class="app-layout-root">
      <!-- Top Global Navbar -->
      <div class="app-navbar-slot">
        <app-navbar></app-navbar>
      </div>

      <!-- Main Content Area -->
      <div class="app-content-area">
        <!-- Sidebar Icon Dock -->
        <div class="app-sidebar-slot">
          <app-sidebar></app-sidebar>
        </div>

        <!-- Routed Content Canvas -->
        <div class="app-canvas">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
    }
    .app-layout-root {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      background-color: #f3f4f6;
      font-family: 'Inter', 'Segoe UI', sans-serif;
    }
    .blur-screen {
      filter: blur(4px);
      pointer-events: none;
    }
    .app-navbar-slot {
      flex-shrink: 0;
    }
    .app-content-area {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .app-sidebar-slot {
      flex-shrink: 0;
      overflow: visible;
    }
    .app-canvas {
      flex: 1;
      overflow-y: auto;
      background-color: #f1f5f9;
      padding: 8px;
    }
  `]
})
export class LayoutComponent {
  isBlurred = false;
  ctrlPressed = false;
  spacePressCount = 0;
  lastPressTime = 0;

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const now = Date.now();

    if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
      this.ctrlPressed = true;
    }

    if (this.ctrlPressed && event.code === 'Space') {
      if (now - this.lastPressTime < 600) {
        this.spacePressCount++;
      } else {
        this.spacePressCount = 1;
      }

      this.lastPressTime = now;
      if (this.spacePressCount === 2) {
        this.isBlurred = !this.isBlurred;
        this.spacePressCount = 0;
      }
    }
  }

  @HostListener('document:keyup', ['$event'])
  resetCtrlKey(event: KeyboardEvent) {
    if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
      this.ctrlPressed = false;
    }
  }
}

