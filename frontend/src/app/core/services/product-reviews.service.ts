import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductReview, ProductReviewsResponse } from '../models/review.model';

export interface ReviewPayload {
  rating: number;
  comment?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductReviewsService {
  private readonly http = inject(HttpClient);

  findByProduct(productId: string): Observable<ProductReviewsResponse> {
    return this.http.get<ProductReviewsResponse>(
      `/api/product-reviews/product/${productId}`,
    );
  }

  create(productId: string, payload: ReviewPayload): Observable<ProductReview> {
    return this.http.post<ProductReview>(
      `/api/product-reviews/product/${productId}`,
      payload,
    );
  }

  update(reviewId: string, payload: ReviewPayload): Observable<ProductReview> {
    return this.http.patch<ProductReview>(
      `/api/product-reviews/${reviewId}`,
      payload,
    );
  }

  remove(reviewId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `/api/product-reviews/${reviewId}`,
    );
  }
}
