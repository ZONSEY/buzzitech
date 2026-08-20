import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateMaintenanceContractPayload,
  MaintenanceContract,
  PaginatedMaintenanceContracts,
} from '../models/maintenance-contract.model';

@Injectable({ providedIn: 'root' })
export class MaintenanceContractsService {
  private readonly http = inject(HttpClient);

  findAll(page = 1, search?: string): Observable<PaginatedMaintenanceContracts> {
    let params = new HttpParams().set('page', page).set('limit', 20);
    if (search) {
      params = params.set('search', search);
    }
    return this.http.get<PaginatedMaintenanceContracts>('/api/maintenance-contracts', { params });
  }

  create(payload: CreateMaintenanceContractPayload): Observable<MaintenanceContract> {
    return this.http.post<MaintenanceContract>('/api/maintenance-contracts', payload);
  }

  update(
    id: string,
    payload: Partial<CreateMaintenanceContractPayload> & { isActive?: boolean },
  ): Observable<MaintenanceContract> {
    return this.http.patch<MaintenanceContract>(`/api/maintenance-contracts/${id}`, payload);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/maintenance-contracts/${id}`);
  }

  generateDue(): Observable<{ generated: number }> {
    return this.http.post<{ generated: number }>('/api/maintenance-contracts/generate-due', {});
  }
}
