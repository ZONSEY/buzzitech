import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BusinessService,
  BusinessServiceCategory,
} from '../../core/models/business-service.model';

interface PaginatedServices {
  data: BusinessService[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface OffreFormValue {
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  estimatedDuration?: number;
  status?: 'AVAILABLE' | 'UNAVAILABLE';
  featured?: boolean;
  categoryId: string;
}

@Injectable({ providedIn: 'root' })
export class AdminOffresService {
  private readonly http = inject(HttpClient);

  findAll(page = 1): Observable<PaginatedServices> {
    return this.http.get<PaginatedServices>('/api/business-services', {
      params: { page, limit: 50 },
    });
  }

  create(dto: OffreFormValue): Observable<BusinessService> {
    return this.http.post<BusinessService>('/api/business-services', dto);
  }

  update(
    id: string,
    dto: Partial<OffreFormValue>,
  ): Observable<BusinessService> {
    return this.http.patch<BusinessService>(
      `/api/business-services/${id}`,
      dto,
    );
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `/api/business-services/${id}`,
    );
  }

  findCategories(): Observable<BusinessServiceCategory[]> {
    return this.http.get<BusinessServiceCategory[]>(
      '/api/business-service-categories/active',
    );
  }
}
