import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { Product } from '../../../core/models/product.model';
import { ProductReview } from '../../../core/models/review.model';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { ProductReviewsService } from '../../../core/services/product-reviews.service';
import { SeoService } from '../../../core/services/seo.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { ProductsService } from '../products.service';
import { IconComponent } from '../../../shared/icon/icon.component';

type LoadState = 'loading' | 'loaded' | 'error' | 'not-found';
type ReviewsState = 'loading' | 'loaded' | 'error';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, IconComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly seoService = inject(SeoService);
  private readonly wishlistService = inject(WishlistService);
  private readonly reviewsService = inject(ProductReviewsService);
  private readonly fb = inject(FormBuilder);

  readonly state = signal<LoadState>('loading');
  readonly product = signal<Product | null>(null);
  readonly activeImage = signal<string | null>(null);
  readonly adding = signal(false);
  readonly addedMessage = signal<string | null>(null);
  readonly togglingWishlist = signal(false);

  readonly isWishlisted = computed(() => {
    const product = this.product();
    return product ? this.wishlistService.isWishlisted(product.id) : false;
  });

  readonly stars = [1, 2, 3, 4, 5];
  readonly reviewsState = signal<ReviewsState>('loading');
  readonly reviews = signal<ProductReview[]>([]);
  readonly averageRating = signal(0);
  readonly reviewCount = signal(0);
  readonly submittingReview = signal(false);
  readonly reviewError = signal<string | null>(null);
  readonly editingReviewId = signal<string | null>(null);

  readonly reviewForm = this.fb.group({
    rating: [0, [Validators.required, Validators.min(1)]],
    comment: [''],
  });

  readonly currentUserId = computed(() => this.authService.currentUser()?.id ?? null);

  readonly myReview = computed(() => {
    const userId = this.currentUserId();
    return userId ? this.reviews().find((r) => r.user.id === userId) ?? null : null;
  });

  constructor() {
    if (this.authService.getAccessToken()) {
      this.wishlistService.refresh().subscribe({ error: () => {} });
    }

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.state.set('loading');
          return this.productsService.findBySlug(params.get('slug')!);
        }),
      )
      .subscribe({
        next: (product) => {
          this.product.set(product);
          const primary =
            product.images.find((img) => img.isPrimary) ?? product.images[0];
          this.activeImage.set(primary?.url ?? null);
          this.state.set('loaded');
          this.seoService.setTitle(`${product.name} — Buzzitech Assistance`);
          this.seoService.setDescription(product.description.slice(0, 160));
          this.loadReviews(product.id);
        },
        error: (err) => {
          this.state.set(err?.status === 404 ? 'not-found' : 'error');
        },
      });
  }

  selectImage(url: string): void {
    this.activeImage.set(url);
  }

  addToCart(): void {
    const product = this.product();
    if (!product) {
      return;
    }

    if (!this.authService.getAccessToken()) {
      this.router.navigate(['/espace-client/connexion']);
      return;
    }

    this.adding.set(true);
    this.addedMessage.set(null);

    this.cartService.addProduct(product.id, 1).subscribe({
      next: () => {
        this.adding.set(false);
        this.addedMessage.set('Ajouté au panier.');
      },
      error: () => {
        this.adding.set(false);
        this.addedMessage.set("Impossible d'ajouter ce produit.");
      },
    });
  }

  toggleWishlist(): void {
    const product = this.product();
    if (!product) {
      return;
    }

    if (!this.authService.getAccessToken()) {
      this.router.navigate(['/espace-client/connexion']);
      return;
    }

    this.togglingWishlist.set(true);
    const request = this.isWishlisted()
      ? this.wishlistService.remove(product.id)
      : this.wishlistService.add(product.id);

    request.subscribe({
      next: () => this.togglingWishlist.set(false),
      error: () => this.togglingWishlist.set(false),
    });
  }

  setRating(value: number): void {
    this.reviewForm.patchValue({ rating: value });
  }

  startEdit(review: ProductReview): void {
    this.editingReviewId.set(review.id);
    this.reviewForm.setValue({
      rating: review.rating,
      comment: review.comment ?? '',
    });
  }

  cancelEdit(): void {
    this.editingReviewId.set(null);
    this.reviewForm.reset({ rating: 0, comment: '' });
  }

  submitReview(): void {
    const product = this.product();
    if (!product || this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    const raw = this.reviewForm.getRawValue();
    const payload = { rating: raw.rating!, comment: raw.comment || undefined };

    this.submittingReview.set(true);
    this.reviewError.set(null);

    const editingId = this.editingReviewId();
    const request = editingId
      ? this.reviewsService.update(editingId, payload)
      : this.reviewsService.create(product.id, payload);

    request.subscribe({
      next: () => {
        this.submittingReview.set(false);
        this.cancelEdit();
        this.loadReviews(product.id);
      },
      error: (err) => {
        this.submittingReview.set(false);
        this.reviewError.set(
          err?.error?.message ?? "Impossible d'enregistrer votre avis.",
        );
      },
    });
  }

  deleteReview(reviewId: string): void {
    const product = this.product();
    if (!product || !confirm('Supprimer votre avis ?')) {
      return;
    }

    this.reviewsService.remove(reviewId).subscribe({
      next: () => this.loadReviews(product.id),
    });
  }

  private loadReviews(productId: string): void {
    this.reviewsState.set('loading');
    this.reviewsService.findByProduct(productId).subscribe({
      next: (res) => {
        this.reviews.set(res.data);
        this.averageRating.set(res.meta.averageRating);
        this.reviewCount.set(res.meta.count);
        this.reviewsState.set('loaded');
      },
      error: () => this.reviewsState.set('error'),
    });
  }
}
