import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Order, PaginatedOrders } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);

  findMine(page = 1): Observable<PaginatedOrders> {
    return this.http.get<PaginatedOrders>('/api/orders/my-commande', {
      params: new HttpParams().set('page', page).set('limit', 10),
    });
  }

  findOne(id: string): Observable<Order> {
    return this.http.get<Order>(`/api/orders/${id}`);
  }

  payOrder(orderId: string): Observable<{ checkoutUrl: string }> {
    return this.http.post<{ checkoutUrl: string }>(
      `/api/payments/${orderId}/checkout`,
      {},
    );
  }

  cancelOrder(orderId: string): Observable<Order> {
    return this.http.patch<Order>(`/api/orders/${orderId}/cancel`, {});
  }

  downloadInvoicePdf(
    orderId: string,
  ): Observable<{ filename: string; content: string }> {
    return this.http.get<{ filename: string; content: string }>(
      `/api/orders/${orderId}/invoice/pdf`,
    );
  }
}
