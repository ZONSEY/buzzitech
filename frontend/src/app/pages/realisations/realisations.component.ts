import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  PaginatedRealisations,
  Realisation,
} from '../../core/models/realisation.model';
import { RealisationsService } from './realisations.service';
import { IconComponent } from '../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-realisations',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './realisations.component.html',
  styleUrl: './realisations.component.css',
})
export class RealisationsComponent {
  private readonly realisationsService = inject(RealisationsService);

  readonly state = signal<LoadState>('loading');
  readonly realisations = signal<Realisation[]>([]);
  readonly meta = signal<PaginatedRealisations['meta']>({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0,
  });

  private readonly page = signal(1);

  constructor() {
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.meta().totalPages) {
      return;
    }
    this.page.set(page);
    this.load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  coverImage(realisation: Realisation): string | null {
    const primary = realisation.images.find((img) => img.isPrimary);
    return primary?.url ?? realisation.images[0]?.url ?? null;
  }

  private load(): void {
    this.state.set('loading');
    this.realisationsService
      .findAll({ page: this.page(), limit: 9 })
      .subscribe({
        next: (res) => {
          this.realisations.set(res.data);
          this.meta.set(res.meta);
          this.state.set('loaded');
        },
        error: () => this.state.set('error'),
      });
  }
}
