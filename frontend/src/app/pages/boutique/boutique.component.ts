import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime } from 'rxjs';
import {
  Brand,
  Category,
  PaginationMeta,
  Product,
  ProductQuery,
} from '../../core/models/product.model';
import { AuthService } from '../../core/services/auth.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { ProductsService } from './products.service';
import { IconComponent } from '../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-boutique',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent],
  templateUrl: './boutique.component.html',
  styleUrl: './boutique.component.css',
})
export class BoutiqueComponent {
  private readonly fb = inject(FormBuilder);
  private readonly productsService = inject(ProductsService);
  private readonly authService = inject(AuthService);
  private readonly wishlistService = inject(WishlistService);

  readonly state = signal<LoadState>('loading');
  readonly products = signal<Product[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly brands = signal<Brand[]>([]);
  readonly page = signal(1);
  readonly togglingWishlistId = signal<string | null>(null);

  readonly filters = this.fb.group({
    search: [''],
    category: [''],
    brand: [''],
    sort: ['createdAt' as NonNullable<ProductQuery['sort']>],
    order: ['desc' as NonNullable<ProductQuery['order']>],
  });

  constructor() {
    this.load();

    if (this.authService.getAccessToken()) {
      this.wishlistService.refresh().subscribe({ error: () => {} });
    }

    this.productsService.findCategories().subscribe({
      next: (categories) => this.categories.set(categories),
    });
    this.productsService.findBrands().subscribe({
      next: (res) => this.brands.set(res.data),
    });

    this.filters.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.page.set(1);
      this.load();
    });
  }

  coverImage(product: Product): string | null {
    const primary = product.images.find((img) => img.isPrimary);
    return primary?.url ?? product.images[0]?.url ?? null;
  }

  isWishlisted(product: Product): boolean {
    return this.wishlistService.isWishlisted(product.id);
  }

  toggleWishlist(event: Event, product: Product): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.authService.getAccessToken()) {
      return;
    }

    this.togglingWishlistId.set(product.id);
    const request = this.isWishlisted(product)
      ? this.wishlistService.remove(product.id)
      : this.wishlistService.add(product.id);

    request.subscribe({
      next: () => this.togglingWishlistId.set(null),
      error: () => this.togglingWishlistId.set(null),
    });
  }

  goToPage(page: number): void {
    const meta = this.meta();
    if (page < 1 || (meta && page > meta.totalPages)) {
      return;
    }
    this.page.set(page);
    this.load();
  }

  resetFilters(): void {
    this.filters.reset({
      search: '',
      category: '',
      brand: '',
      sort: 'createdAt',
      order: 'desc',
    });
  }

  private load(): void {
    this.state.set('loading');
    const raw = this.filters.getRawValue();

    const query: ProductQuery = {
      page: this.page(),
      limit: 12,
      search: raw.search || undefined,
      category: raw.category || undefined,
      brand: raw.brand || undefined,
      sort: raw.sort ?? 'createdAt',
      order: raw.order ?? 'desc',
    };

    this.productsService.findAll(query).subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.meta.set(res.meta);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }
}
