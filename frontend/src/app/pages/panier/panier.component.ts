import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { Address } from '../../core/models/order.model';
import { AddressesService } from '../../core/services/addresses.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { OrdersService } from '../../core/services/orders.service';
import { IconComponent } from '../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error' | 'guest';
type CheckoutState = 'idle' | 'submitting' | 'error';

@Component({
  selector: 'app-panier',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './panier.component.html',
  styleUrl: './panier.component.css',
})
export class PanierComponent {
  private readonly cartService = inject(CartService);
  private readonly addressesService = inject(AddressesService);
  private readonly ordersService = inject(OrdersService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly cart = this.cartService.cart;
  readonly state = signal<LoadState>('loading');
  readonly addresses = signal<Address[]>([]);
  readonly selectedAddressId = signal<string>('');
  readonly checkoutState = signal<CheckoutState>('idle');
  readonly checkoutError = signal<string | null>(null);
  readonly updatingItemId = signal<string | null>(null);
  readonly promoCodeInput = signal('');
  readonly appliedPromoCode = signal<string | null>(null);
  readonly promoDiscount = signal<number | null>(null);
  readonly promoError = signal<string | null>(null);
  readonly applyingPromo = signal(false);

  constructor() {
    if (!this.authService.getAccessToken()) {
      this.state.set('guest');
      return;
    }
    this.load();
  }

  updateQuantity(cartItemId: string, quantity: number): void {
    if (quantity < 1) {
      return;
    }
    this.updatingItemId.set(cartItemId);
    this.cartService.updateQuantity(cartItemId, quantity).subscribe({
      next: () => this.updatingItemId.set(null),
      error: () => this.updatingItemId.set(null),
    });
  }

  removeItem(cartItemId: string): void {
    this.updatingItemId.set(cartItemId);
    this.cartService.removeItem(cartItemId).subscribe({
      next: () => this.updatingItemId.set(null),
      error: () => this.updatingItemId.set(null),
    });
  }

  selectAddress(id: string): void {
    this.selectedAddressId.set(id);
  }

  applyPromoCode(): void {
    const code = this.promoCodeInput().trim();
    if (!code) {
      return;
    }
    this.applyingPromo.set(true);
    this.promoError.set(null);
    this.cartService.previewPromoCode(code).subscribe({
      next: (res) => {
        this.appliedPromoCode.set(code);
        this.promoDiscount.set(res.discountAmount);
        this.applyingPromo.set(false);
      },
      error: (err) => {
        this.appliedPromoCode.set(null);
        this.promoDiscount.set(null);
        this.applyingPromo.set(false);
        this.promoError.set(
          err?.error?.message ?? 'Code promo invalide.',
        );
      },
    });
  }

  removePromoCode(): void {
    this.appliedPromoCode.set(null);
    this.promoDiscount.set(null);
    this.promoCodeInput.set('');
    this.promoError.set(null);
  }

  submitOrder(): void {
    const addressId = this.selectedAddressId();
    if (!addressId) {
      this.checkoutError.set('Choisissez une adresse de livraison.');
      return;
    }

    this.checkoutState.set('submitting');
    this.checkoutError.set(null);

    this.cartService
      .checkout(addressId, 'STRIPE', this.appliedPromoCode() ?? undefined)
      .subscribe({
      next: (order) => {
        this.ordersService.payOrder(order.id).subscribe({
          next: (res) => {
            window.location.href = res.checkoutUrl;
          },
          error: () => {
            // Le paiement Stripe a échoué à démarrer, mais la commande
            // existe déjà : on redirige vers son détail plutôt que de
            // bloquer l'utilisateur.
            this.checkoutState.set('idle');
            this.router.navigate(['/espace-client/commandes', order.id]);
          },
        });
      },
      error: (err) => {
        this.checkoutState.set('error');
        this.checkoutError.set(
          err?.error?.message ?? 'Impossible de valider la commande.',
        );
      },
    });
  }

  private load(): void {
    this.state.set('loading');
    this.cartService.refresh().subscribe({
      next: () => this.state.set('loaded'),
      error: () => this.state.set('error'),
    });
    this.addressesService.findAll().subscribe({
      next: (addresses) => {
        this.addresses.set(addresses);
        const def = addresses.find((a) => a.isDefault) ?? addresses[0];
        if (def) {
          this.selectedAddressId.set(def.id);
        }
      },
    });
  }
}
