import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateEquipmentPayload,
  Equipment,
  PaginatedEquipment,
} from '../models/equipment.model';

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private readonly http = inject(HttpClient);

  findAll(page = 1, search?: string): Observable<PaginatedEquipment> {
    let params = new HttpParams().set('page', page).set('limit', 20);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<PaginatedEquipment>('/api/equipment', { params });
  }

  findMine(): Observable<Equipment[]> {
    return this.http.get<Equipment[]>('/api/equipment/mine');
  }

  findByClient(clientId: string): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(`/api/equipment/client/${clientId}`);
  }

  create(payload: CreateEquipmentPayload): Observable<Equipment> {
    return this.http.post<Equipment>('/api/equipment', payload);
  }

  update(
    id: string,
    payload: Partial<CreateEquipmentPayload>,
  ): Observable<Equipment> {
    return this.http.patch<Equipment>(`/api/equipment/${id}`, payload);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/equipment/${id}`);
  }
}
