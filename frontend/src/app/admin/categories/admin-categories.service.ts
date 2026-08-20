import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Brand, Category } from '../../core/models/product.model';
import { BusinessServiceCategory } from '../../core/models/business-service.model';

export interface CreateCategoryPayload {
  name: string;
  slug: string;
  description?: string;
}

export interface CreateBrandPayload {
  name: string;
  slug: string;
  logo?: string;
}

export interface CreateServiceCategoryPayload {
  name: string;
  slug: string;
  description?: string;
}

interface PaginatedBrands {
  data: Brand[];
}

@Injectable({ providedIn: 'root' })
export class AdminCategoriesService {
  private readonly http = inject(HttpClient);

  findCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/api/categories');
  }

  createCategory(dto: CreateCategoryPayload): Observable<Category> {
    return this.http.post<Category>('/api/categories', dto);
  }

  toggleCategoryActive(category: Category): Observable<Category> {
    return this.http.patch<Category>(`/api/categories/${category.id}`, {
      isActive: !category.isActive,
    });
  }

  removeCategory(id: string): Observable<unknown> {
    return this.http.delete(`/api/categories/${id}`);
  }

  findBrands(): Observable<PaginatedBrands> {
    return this.http.get<PaginatedBrands>('/api/brands', {
      params: { limit: 100 },
    });
  }

  createBrand(dto: CreateBrandPayload): Observable<Brand> {
    return this.http.post<Brand>('/api/brands', dto);
  }

  toggleBrandActive(id: string): Observable<Brand> {
    return this.http.patch<Brand>(`/api/brands/${id}/toggle-status`, {});
  }

  removeBrand(id: string): Observable<unknown> {
    return this.http.delete(`/api/brands/${id}`);
  }

  findServiceCategories(): Observable<{ data: BusinessServiceCategory[] }> {
    return this.http.get<{ data: BusinessServiceCategory[] }>(
      '/api/business-service-categories',
      { params: { limit: 100 } },
    );
  }

  createServiceCategory(
    dto: CreateServiceCategoryPayload,
  ): Observable<BusinessServiceCategory> {
    return this.http.post<BusinessServiceCategory>(
      '/api/business-service-categories',
      dto,
    );
  }

  toggleServiceCategoryActive(
    id: string,
  ): Observable<BusinessServiceCategory> {
    return this.http.patch<BusinessServiceCategory>(
      `/api/business-service-categories/${id}/toggle-status`,
      {},
    );
  }

  removeServiceCategory(id: string): Observable<unknown> {
    return this.http.delete(`/api/business-service-categories/${id}`);
  }
}
