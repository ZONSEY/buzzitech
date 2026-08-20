import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Brand,
  Category,
  PaginatedProducts,
  Product,
  ProductQuery,
} from '../../core/models/product.model';

interface PaginatedBrands {
  data: Brand[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);

  findAll(query: ProductQuery): Observable<PaginatedProducts> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value);
      }
    });

    return this.http.get<PaginatedProducts>('/api/products', { params });
  }

  findBySlug(slug: string): Observable<Product> {
    return this.http.get<Product>(`/api/products/slug/${slug}`);
  }

  findCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/categories');
  }

  findBrands(): Observable<PaginatedBrands> {
    // limit=100 : on veut la liste complète pour le filtre, pas une page
    return this.http.get<PaginatedBrands>('/api/brands', {
      params: new HttpParams().set('limit', 100),
    });
  }
}
