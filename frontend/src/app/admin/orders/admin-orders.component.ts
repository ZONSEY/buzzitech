import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { Order, OrderStatus } from '../../core/models/order.model';
import { PaginationMeta } from '../../core/models/product.model';
import { AdminOrdersService } from './admin-orders.service';
import { IconComponent } from '../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

const STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'COMPLETED',
  'CANCELLED',
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PROCESSING: 'En préparation',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.css',
})
export class AdminOrdersComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AdminOrdersService);

  readonly statuses = STATUSES;
  readonly statusLabels = STATUS_LABELS;

  readonly state = signal<LoadState>('loading');
  readonly orders = signal<Order[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly page = signal(1);
  readonly updatingId = signal<string | null>(null);

  readonly filters = this.fb.group({
    search: [''],
    status: [''],
  });

  constructor() {
    this.load();

    this.filters.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  statusLabel(status: string): string {
    return this.statusLabels[status as OrderStatus] ?? status;
  }

  clientName(order: Order): string {
    if (!order.user) {
      return '—';
    }
    return `${order.user.prenom} ${order.user.nom}`;
  }

  goToPage(page: number): void {
    const meta = this.meta();
    if (page < 1 || (meta && page > meta.totalPages)) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  changeStatus(order: Order, status: string): void {
    if (!status || status === order.status) {
      return;
    }

    this.updatingId.set(order.id);
    this.service.updateStatus(order.id, status as OrderStatus).subscribe({
      next: (updated) => {
        this.updatingId.set(null);
        this.orders.update((list) =>
          list.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o)),
        );
      },
      error: () => this.updatingId.set(null),
    });
  }

  private load(): void {
    this.state.set('loading');
    const raw = this.filters.getRawValue();

    this.service
      .findAll({
        page: this.page(),
        search: raw.search || undefined,
        status: (raw.status || undefined) as OrderStatus | undefined,
      })
      .subscribe({
        next: (res) => {
          this.orders.set(res.data);
          this.meta.set(res.meta);
          this.state.set('loaded');
        },
        error: () => this.state.set('error'),
      });
  }
}
