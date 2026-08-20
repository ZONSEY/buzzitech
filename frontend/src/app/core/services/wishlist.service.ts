import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { WishlistItem } from '../models/wishlist.model';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly http = inject(HttpClient);

  readonly items = signal<WishlistItem[]>([]);
  readonly productIds = computed(
    () => new Set(this.items().map((i) => i.product.id)),
  );

  refresh(): Observable<WishlistItem[]> {
    return this.http
      .get<WishlistItem[]>('/api/wishlist')
      .pipe(tap((items) => this.items.set(items)));
  }

  add(productId: string): Observable<{ success: boolean }> {
    return this.http
      .post<{ success: boolean }>(`/api/wishlist/${productId}`, {})
      .pipe(tap(() => this.refresh().subscribe()));
  }

  remove(productId: string): Observable<{ success: boolean }> {
    return this.http
      .delete<{ success: boolean }>(`/api/wishlist/${productId}`)
      .pipe(tap(() => this.refresh().subscribe()));
  }

  isWishlisted(productId: string): boolean {
    return this.productIds().has(productId);
  }

  reset(): void {
    this.items.set([]);
  }
}
