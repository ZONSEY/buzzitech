import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Brand,
  Category,
  PaginatedProducts,
  Product,
} from '../../core/models/product.model';

export interface ProductFormValue {
  name: string;
  slug: string;
  description: string;
  sku?: string;
  price: number;
  stock: number;
  isActive?: boolean;
  featured?: boolean;
  categoryId: string;
  brandId: string;
  warranty?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminProductsService {
  private readonly http = inject(HttpClient);

  findAll(page = 1): Observable<PaginatedProducts> {
    return this.http.get<PaginatedProducts>('/api/products', {
      params: { page, limit: 20 },
    });
  }

  create(dto: ProductFormValue): Observable<Product> {
    return this.http.post<Product>('/api/products', dto);
  }

  update(id: string, dto: Partial<ProductFormValue>): Observable<Product> {
    return this.http.patch<Product>(`/api/products/${id}`, dto);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/products/${id}`);
  }

  findCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/categories');
  }

  findBrands(): Observable<{ data: Brand[] }> {
    return this.http.get<{ data: Brand[] }>('/api/brands', {
      params: { limit: 100 },
    });
  }

  uploadImage(productId: string, file: File): Observable<unknown> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(`/api/product-images/${productId}`, formData);
  }

  removeImage(imageId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `/api/product-images/${imageId}`,
    );
  }
}
