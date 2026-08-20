import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { IconComponent } from '../../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-liste-souhaits',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './liste-souhaits.component.html',
  styleUrl: './liste-souhaits.component.css',
})
export class ListeSouhaitsComponent {
  private readonly wishlistService = inject(WishlistService);
  private readonly cartService = inject(CartService);

  readonly state = signal<LoadState>('loading');
  readonly items = this.wishlistService.items;
  readonly removingId = signal<string | null>(null);
  readonly addingId = signal<string | null>(null);

  constructor() {
    this.wishlistService.refresh().subscribe({
      next: () => this.state.set('loaded'),
      error: () => this.state.set('error'),
    });
  }

  remove(productId: string): void {
    this.removingId.set(productId);
    this.wishlistService.remove(productId).subscribe({
      next: () => this.removingId.set(null),
      error: () => this.removingId.set(null),
    });
  }

  addToCart(productId: string): void {
    this.addingId.set(productId);
    this.cartService.addProduct(productId, 1).subscribe({
      next: () => this.addingId.set(null),
      error: () => this.addingId.set(null),
    });
  }
}
