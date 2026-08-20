import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import { PaginationMeta } from '../../core/models/product.model';
import {
  INTERVENTION_STATUS_LABELS,
  Intervention,
} from '../../core/models/intervention.model';
import { InterventionsService } from '../../core/services/interventions.service';
import { IconComponent } from '../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-technicien-historique',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './technicien-historique.component.html',
})
export class TechnicienHistoriqueComponent {
  private readonly fb = inject(FormBuilder);
  private readonly interventionsService = inject(InterventionsService);

  readonly statusLabels = INTERVENTION_STATUS_LABELS;
  readonly state = signal<LoadState>('loading');
  readonly missions = signal<Intervention[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly page = signal(1);

  readonly filters = this.fb.group({
    search: [''],
    from: [''],
    to: [''],
  });

  constructor() {
    this.load();

    this.filters.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  goToPage(page: number): void {
    const meta = this.meta();
    if (page < 1 || (meta && page > meta.totalPages)) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  private load(): void {
    this.state.set('loading');
    const raw = this.filters.getRawValue();

    this.interventionsService
      .findMine({
        page: this.page(),
        status: 'COMPLETED',
        search: raw.search || undefined,
        from: raw.from || undefined,
        to: raw.to || undefined,
        limit: 15,
      })
      .subscribe({
        next: (res) => {
          this.missions.set(res.data);
          this.meta.set(res.meta);
          this.state.set('loaded');
        },
        error: () => this.state.set('error'),
      });
  }
}
