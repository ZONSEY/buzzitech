import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreatePromoCodePayload,
  PaginatedPromoCodes,
  PromoCode,
  UpdatePromoCodePayload,
} from '../models/promo-code.model';

@Injectable({ providedIn: 'root' })
export class PromoCodesService {
  private readonly http = inject(HttpClient);

  findAll(page = 1, search?: string): Observable<PaginatedPromoCodes> {
    let params = new HttpParams().set('page', page).set('limit', 20);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<PaginatedPromoCodes>('/api/promo-codes', { params });
  }

  create(payload: CreatePromoCodePayload): Observable<PromoCode> {
    return this.http.post<PromoCode>('/api/promo-codes', payload);
  }

  update(id: string, payload: UpdatePromoCodePayload): Observable<PromoCode> {
    return this.http.patch<PromoCode>(`/api/promo-codes/${id}`, payload);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/promo-codes/${id}`);
  }
}
