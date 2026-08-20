import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Order, OrderStatus, PaginatedOrders } from '../../core/models/order.model';

export interface AdminOrderFilter {
  page?: number;
  search?: string;
  status?: OrderStatus | '';
}

@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  private readonly http = inject(HttpClient);

  findAll(filter: AdminOrderFilter): Observable<PaginatedOrders> {
    let params = new HttpParams().set('page', filter.page ?? 1).set('limit', 15);
    if (filter.search) {
      params = params.set('search', filter.search);
    }
    if (filter.status) {
      params = params.set('status', filter.status);
    }

    return this.http.get<PaginatedOrders>('/api/orders', { params });
  }

  updateStatus(id: string, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`/api/orders/${id}/status`, { status });
  }
}
