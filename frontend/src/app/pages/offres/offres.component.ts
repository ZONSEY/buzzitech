import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  BusinessService,
  BusinessServiceCategory,
} from '../../core/models/business-service.model';
import { OffresService } from './offres.service';
import { IconComponent } from '../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

interface CategoryGroup {
  category: BusinessServiceCategory;
  services: BusinessService[];
}

@Component({
  selector: 'app-offres',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './offres.component.html',
  styleUrl: './offres.component.css',
})
export class OffresComponent {
  private readonly offresService = inject(OffresService);

  readonly state = signal<LoadState>('loading');
  readonly groups = signal<CategoryGroup[]>([]);

  constructor() {
    this.load();
  }

  private load(): void {
    this.state.set('loading');
    this.offresService.findActiveCategories().subscribe({
      next: (categories) => {
        if (categories.length === 0) {
          this.groups.set([]);
          this.state.set('loaded');
          return;
        }

        const calls = categories.map((category) =>
          this.offresService.findServicesByCategory(category.id),
        );

        forkJoin(calls).subscribe({
          next: (results) => {
            this.groups.set(
              categories.map((category, i) => ({
                category,
                services: results[i].data,
              })),
            );
            this.state.set('loaded');
          },
          error: () => this.state.set('error'),
        });
      },
      error: () => this.state.set('error'),
    });
  }
}
