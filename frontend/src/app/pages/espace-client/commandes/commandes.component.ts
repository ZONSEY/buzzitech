import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Order, PaginatedOrders } from '../../../core/models/order.model';
import { OrdersService } from '../../../core/services/orders.service';
import { IconComponent } from '../../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PROCESSING: 'En préparation',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

@Component({
  selector: 'app-commandes',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './commandes.component.html',
  styleUrl: './commandes.component.css',
})
export class CommandesComponent {
  private readonly service = inject(OrdersService);

  readonly state = signal<LoadState>('loading');
  readonly orders = signal<Order[]>([]);
  readonly meta = signal<PaginatedOrders['meta']>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  constructor() {
    this.load(1);
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.meta().totalPages) {
      return;
    }
    this.load(page);
  }

  private load(page: number): void {
    this.state.set('loading');
    this.service.findMine(page).subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.meta.set(res.meta);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }
}
