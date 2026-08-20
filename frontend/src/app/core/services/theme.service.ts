import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject, signal } from '@angular/core';

export type AppTheme = 'dark' | 'light';

const STORAGE_KEY = 'buzzitech-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly theme = signal<AppTheme>(this.resolveInitialTheme());

  constructor() {
    effect(() => {
      const value = this.theme();
      if (!this.isBrowser) {
        return;
      }
      document.documentElement.setAttribute('data-theme', value);
      localStorage.setItem(STORAGE_KEY, value);
    });
  }

  toggle(): void {
    this.theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  private resolveInitialTheme(): AppTheme {
    if (!this.isBrowser) {
      return 'dark';
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    return window.matchMedia?.('(prefers-color-scheme: light)').matches
      ? 'light'
      : 'dark';
  }
}
