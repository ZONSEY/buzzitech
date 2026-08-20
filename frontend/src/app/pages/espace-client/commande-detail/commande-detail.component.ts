import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { Order } from '../../../core/models/order.model';
import { OrdersService } from '../../../core/services/orders.service';
import { IconComponent } from '../../../shared/icon/icon.component';
import { downloadBase64File } from '../../../shared/utils/download-base64.util';

type LoadState = 'loading' | 'loaded' | 'error' | 'not-found';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PROCESSING: 'En préparation',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

@Component({
  selector: 'app-commande-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './commande-detail.component.html',
  styleUrl: './commande-detail.component.css',
})
export class CommandeDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(OrdersService);

  readonly state = signal<LoadState>('loading');
  readonly order = signal<Order | null>(null);
  readonly paymentFeedback = signal<'success' | 'cancelled' | null>(null);
  readonly cancelling = signal(false);
  readonly cancelError = signal<string | null>(null);
  readonly downloadingInvoice = signal(false);

  constructor() {
    this.paymentFeedback.set(
      (this.route.snapshot.queryParamMap.get('payment') as
        | 'success'
        | 'cancelled'
        | null) ?? null,
    );

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.state.set('loading');
          return this.service.findOne(params.get('id')!);
        }),
      )
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.state.set('loaded');
        },
        error: (err) => {
          this.state.set(err?.status === 404 ? 'not-found' : 'error');
        },
      });
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  itemName(item: Order['items'][number]): string {
    return item.product?.name ?? item.businessService?.name ?? 'Article';
  }

  pay(): void {
    const order = this.order();
    if (!order) {
      return;
    }
    this.service.payOrder(order.id).subscribe({
      next: (res) => (window.location.href = res.checkoutUrl),
    });
  }

  downloadInvoice(): void {
    const order = this.order();
    if (!order) {
      return;
    }
    this.downloadingInvoice.set(true);
    this.service.downloadInvoicePdf(order.id).subscribe({
      next: ({ filename, content }) => {
        downloadBase64File(filename, content);
        this.downloadingInvoice.set(false);
      },
      error: () => this.downloadingInvoice.set(false),
    });
  }

  cancel(): void {
    const order = this.order();
    if (!order || !confirm('Annuler cette commande ?')) {
      return;
    }

    this.cancelling.set(true);
    this.cancelError.set(null);

    this.service.cancelOrder(order.id).subscribe({
      next: (updated) => {
        this.cancelling.set(false);
        this.order.update((o) => (o ? { ...o, status: updated.status } : o));
      },
      error: (err) => {
        this.cancelling.set(false);
        this.cancelError.set(
          err?.error?.message ?? "Impossible d'annuler cette commande.",
        );
      },
    });
  }
}
