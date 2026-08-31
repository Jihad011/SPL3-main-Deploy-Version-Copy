import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private _sidebarExpanded = new BehaviorSubject<boolean>(false);
  private _drawerOpen = new BehaviorSubject<boolean>(false);
  private _selectedModuleName = new BehaviorSubject<string>('SPL3 Open Credit');
  selectedModuleName$ = this._selectedModuleName.asObservable();
  sidebarExpanded$ = this._sidebarExpanded.asObservable();
  drawerOpen$ = this._drawerOpen.asObservable();
  private _appListReady = new Subject<void>();
  appListReady$ = this._appListReady.asObservable();
  private _resourceListReady = new Subject<void>();
  resourceListReady$ = this._resourceListReady.asObservable();
  private router = inject(Router);

  private _currentPageName = new BehaviorSubject<string>('Dashboard');
  currentPageName$ = this._currentPageName.asObservable();

  setSelectedModuleName(moduleName: string): void {
    this._selectedModuleName.next(moduleName);
  }

  getSelectedModuleName(): string {
    return this._selectedModuleName.value;
  }

  toggleSidebar(): void {
    this._sidebarExpanded.next(!this._sidebarExpanded.value);
  }

  setSidebarState(isExpanded: boolean): void {
    this._sidebarExpanded.next(isExpanded);
  }

  setDrawerOpen(isOpen: boolean): void {
    this._drawerOpen.next(isOpen);
  }

  closeDrawer(): void {
    this.setDrawerOpen(false);
  }

  openDrawer(): void {
    this.setDrawerOpen(true);
  }

  toggleDrawer(): void {
    this._drawerOpen.next(!this._drawerOpen.value);
  }

  setCurrentPageName(pageName: string): void {
    this._currentPageName.next(pageName);
    localStorage.setItem('currentPageName', pageName);
  }

  getCurrentPageName(): string {
    return this._currentPageName.value;
  }

  initializePageName(): void {
    const storedPageName = localStorage.getItem('currentPageName');
    if (storedPageName) {
      this._currentPageName.next(storedPageName);
    }
  }

  notifyAppListReady(): void {
    this._appListReady.next();
  }

  notifyResourceListReady(): void {
    this._resourceListReady.next();
  }
}
