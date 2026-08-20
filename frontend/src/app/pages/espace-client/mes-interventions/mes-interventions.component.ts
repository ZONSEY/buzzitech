import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaginationMeta } from '../../../core/models/product.model';
import {
  INTERVENTION_STATUS_LABELS,
  Intervention,
} from '../../../core/models/intervention.model';
import { InterventionsService } from '../../../core/services/interventions.service';
import { IconComponent } from '../../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-mes-interventions',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './mes-interventions.component.html',
})
export class MesInterventionsComponent {
  private readonly service = inject(InterventionsService);

  readonly statusLabels = INTERVENTION_STATUS_LABELS;
  readonly state = signal<LoadState>('loading');
  readonly interventions = signal<Intervention[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly page = signal(1);

  constructor() {
    this.load();
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
    this.service.findMineAsClient({ page: this.page() }).subscribe({
      next: (res) => {
        this.interventions.set(res.data);
        this.meta.set(res.meta);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }
}
