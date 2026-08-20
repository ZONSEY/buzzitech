import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  PaginatedRealisations,
  Realisation,
} from '../../core/models/realisation.model';

interface RealisationQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
}

@Injectable({ providedIn: 'root' })
export class RealisationsService {
  private readonly http = inject(HttpClient);

  findAll(query: RealisationQuery): Observable<PaginatedRealisations> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value);
      }
    });

    return this.http.get<PaginatedRealisations>('/api/realisations', {
      params,
    });
  }

  findBySlug(slug: string): Observable<Realisation> {
    return this.http.get<Realisation>(`/api/realisations/slug/${slug}`);
  }
}
