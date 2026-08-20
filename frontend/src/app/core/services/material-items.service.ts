import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateMaterialItemPayload,
  MaterialItem,
  MaterialItemFilter,
  PaginatedMaterialItems,
  UpdateMaterialItemPayload,
} from '../models/material-item.model';

@Injectable({ providedIn: 'root' })
export class MaterialItemsService {
  private readonly http = inject(HttpClient);

  findAll(filter: MaterialItemFilter): Observable<PaginatedMaterialItems> {
    let params = new HttpParams()
      .set('page', filter.page ?? 1)
      .set('limit', filter.limit ?? 50);
    if (filter.search) {
      params = params.set('search', filter.search);
    }
    if (filter.activeOnly) {
      params = params.set('activeOnly', 'true');
    }
    return this.http.get<PaginatedMaterialItems>('/api/material-items', {
      params,
    });
  }

  create(payload: CreateMaterialItemPayload): Observable<MaterialItem> {
    return this.http.post<MaterialItem>('/api/material-items', payload);
  }

  update(
    id: string,
    payload: UpdateMaterialItemPayload,
  ): Observable<MaterialItem> {
    return this.http.patch<MaterialItem>(`/api/material-items/${id}`, payload);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/material-items/${id}`);
  }

  uploadImage(id: string, file: File): Observable<MaterialItem> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<MaterialItem>(
      `/api/material-items/${id}/image`,
      formData,
    );
  }

  removeImage(id: string): Observable<MaterialItem> {
    return this.http.delete<MaterialItem>(`/api/material-items/${id}/image`);
  }
}
