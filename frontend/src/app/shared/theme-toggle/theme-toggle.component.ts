import { Component, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [IconComponent],
  template: `
    <button
      type="button"
      (click)="themeService.toggle()"
      class="inline-flex h-10 w-10 items-center justify-center rounded border border-buzz-border text-buzz-muted transition-colors hover:bg-buzz-surface-2 hover:text-buzz-text"
      [attr.aria-label]="themeService.theme() === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'"
      title="Changer de thème"
    >
      @if (themeService.theme() === 'dark') {
        <app-icon name="sun" [size]="18" />
      } @else {
        <app-icon name="moon" [size]="18" />
      }
    </button>
  `,
})
export class ThemeToggleComponent {
  readonly themeService = inject(ThemeService);
}
