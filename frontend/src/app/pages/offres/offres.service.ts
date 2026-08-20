import { HttpClient, HttpParams } from '@angular/common/http';
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

@Injectable({ providedIn: 'root' })
export class OffresService {
  private readonly http = inject(HttpClient);

  findActiveCategories(): Observable<BusinessServiceCategory[]> {
    return this.http.get<BusinessServiceCategory[]>(
      '/api/business-service-categories/active',
    );
  }

  findServicesByCategory(categoryId: string): Observable<PaginatedServices> {
    return this.http.get<PaginatedServices>('/api/business-services', {
      params: new HttpParams()
        .set('categoryId', categoryId)
        .set('limit', 50),
    });
  }
}
