import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { tap } from 'rxjs';
import { Cart } from '../models/order.model';

const EMPTY_CART: Cart = {
  id: '',
  items: [],
  totalItems: 0,
  productsTotal: 0,
  servicesTotal: 0,
  grandTotal: 0,
};

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);

  readonly cart = signal<Cart>(EMPTY_CART);

  refresh() {
    return this.http
      .get<Cart>('/api/cart')
      .pipe(tap((cart) => this.cart.set(cart)));
  }

  addProduct(productId: string, quantity = 1) {
    return this.http
      .post<Cart>('/api/cart/items', { productId, quantity })
      .pipe(tap((cart) => this.cart.set(cart)));
  }

  addService(businessServiceId: string) {
    return this.http
      .post<Cart>('/api/cart/items', { businessServiceId, quantity: 1 })
      .pipe(tap((cart) => this.cart.set(cart)));
  }

  updateQuantity(cartItemId: string, quantity: number) {
    return this.http
      .patch<Cart>(`/api/cart/items/${cartItemId}`, { quantity })
      .pipe(tap((cart) => this.cart.set(cart)));
  }

  removeItem(cartItemId: string) {
    return this.http
      .delete<Cart>(`/api/cart/items/${cartItemId}`)
      .pipe(tap((cart) => this.cart.set(cart)));
  }

  clear() {
    return this.http
      .delete<Cart>('/api/cart/clear')
      .pipe(tap((cart) => this.cart.set(cart)));
  }

  checkout(addressId: string, paymentMethod: string, promoCode?: string) {
    return this.http
      .post<{ id: string }>('/api/cart/checkout', {
        addressId,
        paymentMethod,
        promoCode: promoCode || undefined,
      })
      .pipe(tap(() => this.cart.set(EMPTY_CART)));
  }

  previewPromoCode(code: string) {
    return this.http.post<{
      subtotal: number;
      discountAmount: number;
      total: number;
    }>('/api/cart/promo-code/preview', { code });
  }

  reset() {
    this.cart.set(EMPTY_CART);
  }
}
