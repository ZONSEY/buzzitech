import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { Realisation } from '../../../core/models/realisation.model';
import { SeoService } from '../../../core/services/seo.service';
import { RealisationsService } from '../realisations.service';
import { IconComponent } from '../../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error' | 'not-found';

@Component({
  selector: 'app-realisation-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './realisation-detail.component.html',
  styleUrl: './realisation-detail.component.css',
})
export class RealisationDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly realisationsService = inject(RealisationsService);
  private readonly seoService = inject(SeoService);

  readonly state = signal<LoadState>('loading');
  readonly realisation = signal<Realisation | null>(null);
  readonly activeImage = signal<string | null>(null);

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.state.set('loading');
          return this.realisationsService.findBySlug(params.get('slug')!);
        }),
      )
      .subscribe({
        next: (realisation) => {
          this.realisation.set(realisation);
          const primary =
            realisation.images.find((img) => img.isPrimary) ??
            realisation.images[0];
          this.activeImage.set(primary?.url ?? null);
          this.state.set('loaded');
          this.seoService.setTitle(`${realisation.title} — Buzzitech Assistance`);
          this.seoService.setDescription(
            (realisation.shortDescription ?? realisation.description).slice(0, 160),
          );
        },
        error: (err) => {
          this.state.set(err?.status === 404 ? 'not-found' : 'error');
        },
      });
  }

  selectImage(url: string): void {
    this.activeImage.set(url);
  }
}
