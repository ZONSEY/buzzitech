import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, switchMap } from 'rxjs';
import { SearchResults } from '../../core/models/search.model';
import { SearchService } from '../../core/services/search.service';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-search-overlay',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './search-overlay.component.html',
})
export class SearchOverlayComponent {
  private readonly searchService = inject(SearchService);
  private readonly router = inject(Router);

  readonly isOpen = signal(false);
  readonly results = signal<SearchResults | null>(null);
  readonly searching = signal(false);
  readonly control = new FormControl('', { nonNullable: true });

  constructor() {
    this.control.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        filter((q) => q.trim().length >= 2 || q.trim().length === 0),
        switchMap((q) => {
          if (q.trim().length < 2) {
            this.results.set(null);
            return [];
          }
          this.searching.set(true);
          return this.searchService.search(q.trim());
        }),
      )
      .subscribe({
        next: (res) => {
          this.results.set(res);
          this.searching.set(false);
        },
        error: () => this.searching.set(false),
      });
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.control.setValue('');
    this.results.set(null);
  }

  hasResults(): boolean {
    const r = this.results();
    return !!r && (r.products.length > 0 || r.services.length > 0 || r.realisations.length > 0);
  }

  goToProduct(slug: string): void {
    this.router.navigate(['/boutique', slug]);
    this.close();
  }

  goToRealisation(slug: string): void {
    this.router.navigate(['/realisations', slug]);
    this.close();
  }

  goToServices(): void {
    this.router.navigate(['/offres']);
    this.close();
  }
}
