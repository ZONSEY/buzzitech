import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  PaginatedRealisations,
  Realisation,
} from '../../core/models/realisation.model';
import { BusinessServiceCategory } from '../../core/models/business-service.model';

export interface RealisationFormValue {
  title: string;
  description: string;
  shortDescription?: string;
  clientName?: string;
  location?: string;
  completedAt?: string;
  categoryId?: string;
  featured?: boolean;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AdminRealisationsService {
  private readonly http = inject(HttpClient);

  findAll(page = 1): Observable<PaginatedRealisations> {
    return this.http.get<PaginatedRealisations>('/api/realisations/admin', {
      params: { page, limit: 20 },
    });
  }

  create(dto: RealisationFormValue): Observable<Realisation> {
    return this.http.post<Realisation>('/api/realisations', dto);
  }

  update(id: string, dto: Partial<RealisationFormValue>): Observable<Realisation> {
    return this.http.patch<Realisation>(`/api/realisations/${id}`, dto);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/realisations/${id}`);
  }

  findCategories(): Observable<BusinessServiceCategory[]> {
    return this.http.get<BusinessServiceCategory[]>(
      '/api/business-service-categories/active',
    );
  }

  uploadImage(realisationId: string, file: File): Observable<unknown> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post(
      `/api/realisation-images/${realisationId}`,
      formData,
    );
  }

  removeImage(imageId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `/api/realisation-images/${imageId}`,
    );
  }
}
