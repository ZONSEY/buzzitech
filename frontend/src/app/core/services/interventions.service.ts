import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateInterventionPayload,
  Intervention,
  InterventionFilter,
  InterventionPerson,
  PaginatedInterventions,
  TechnicianStats,
  UpdateInterventionPayload,
} from '../models/intervention.model';

function toParams(filter: InterventionFilter): HttpParams {
  let params = new HttpParams()
    .set('page', filter.page ?? 1)
    .set('limit', filter.limit ?? 20);

  if (filter.status) {
    params = params.set('status', filter.status);
  }
  if (filter.technicianId) {
    params = params.set('technicianId', filter.technicianId);
  }
  if (filter.search) {
    params = params.set('search', filter.search);
  }
  if (filter.from) {
    params = params.set('from', filter.from);
  }
  if (filter.to) {
    params = params.set('to', filter.to);
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class InterventionsService {
  private readonly http = inject(HttpClient);

  // --- Admin ---

  create(payload: CreateInterventionPayload): Observable<Intervention> {
    return this.http.post<Intervention>('/api/interventions', payload);
  }

  findAll(filter: InterventionFilter): Observable<PaginatedInterventions> {
    return this.http.get<PaginatedInterventions>('/api/interventions', {
      params: toParams(filter),
    });
  }

  findTechnicians(): Observable<InterventionPerson[]> {
    return this.http.get<InterventionPerson[]>('/api/interventions/technicians');
  }

  update(
    id: string,
    payload: UpdateInterventionPayload,
  ): Observable<Intervention> {
    return this.http.patch<Intervention>(`/api/interventions/${id}`, payload);
  }

  cancel(id: string): Observable<Intervention> {
    return this.http.patch<Intervention>(`/api/interventions/${id}/cancel`, {});
  }

  // --- Technicien ---

  findMine(filter: InterventionFilter): Observable<PaginatedInterventions> {
    return this.http.get<PaginatedInterventions>('/api/interventions/me', {
      params: toParams(filter),
    });
  }

  findMyStats(): Observable<TechnicianStats> {
    return this.http.get<TechnicianStats>('/api/interventions/me/stats');
  }

  accept(id: string): Observable<Intervention> {
    return this.http.patch<Intervention>(`/api/interventions/${id}/accept`, {});
  }

  markOnTheWay(id: string): Observable<Intervention> {
    return this.http.patch<Intervention>(
      `/api/interventions/${id}/on-the-way`,
      {},
    );
  }

  start(id: string): Observable<Intervention> {
    return this.http.patch<Intervention>(`/api/interventions/${id}/start`, {});
  }

  updateObservations(
    id: string,
    observations: string,
  ): Observable<Intervention> {
    return this.http.patch<Intervention>(
      `/api/interventions/${id}/observations`,
      { observations },
    );
  }

  addMaterial(
    id: string,
    payload: { name?: string; materialItemId?: string; quantity?: number },
  ): Observable<Intervention> {
    return this.http.post<Intervention>(
      `/api/interventions/${id}/materials`,
      payload,
    );
  }

  removeMaterial(id: string, materialId: string): Observable<Intervention> {
    return this.http.delete<Intervention>(
      `/api/interventions/${id}/materials/${materialId}`,
    );
  }

  addPhoto(id: string, file: File): Observable<Intervention> {
    const formData = new FormData();
    formData.append('photo', file);
    return this.http.post<Intervention>(
      `/api/interventions/${id}/photos`,
      formData,
    );
  }

  removePhoto(id: string, photoId: string): Observable<Intervention> {
    return this.http.delete<Intervention>(
      `/api/interventions/${id}/photos/${photoId}`,
    );
  }

  complete(
    id: string,
    report: string,
    actualDuration?: number,
    clientSignature?: string,
  ): Observable<Intervention> {
    return this.http.patch<Intervention>(`/api/interventions/${id}/complete`, {
      report,
      actualDuration,
      clientSignature,
    });
  }

  downloadReportPdf(id: string): Observable<{ filename: string; content: string }> {
    return this.http.get<{ filename: string; content: string }>(
      `/api/interventions/${id}/report/pdf`,
    );
  }

  // --- Client ---

  findMineAsClient(
    filter: InterventionFilter,
  ): Observable<PaginatedInterventions> {
    return this.http.get<PaginatedInterventions>(
      '/api/interventions/mine-client',
      { params: toParams(filter) },
    );
  }

  rate(
    id: string,
    rating: number,
    comment?: string,
  ): Observable<Intervention> {
    return this.http.patch<Intervention>(`/api/interventions/${id}/rate`, {
      rating,
      comment,
    });
  }

  // --- Partagé ---

  findOne(id: string): Observable<Intervention> {
    return this.http.get<Intervention>(`/api/interventions/${id}`);
  }
}
