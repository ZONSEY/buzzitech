import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateQuoteItemPayload,
  EstimateProjectPayload,
  ProjectRequest,
  ProjectStatus,
} from '../../core/models/project-request.model';

@Injectable({ providedIn: 'root' })
export class AdminProjetsService {
  private readonly http = inject(HttpClient);

  findAll(): Observable<ProjectRequest[]> {
    return this.http.get<ProjectRequest[]>('/api/project-requests');
  }

  updateStatus(id: string, status: ProjectStatus): Observable<ProjectRequest> {
    return this.http.patch<ProjectRequest>(
      `/api/project-requests/${id}/status`,
      { status },
    );
  }

  estimate(
    id: string,
    dto: EstimateProjectPayload,
  ): Observable<ProjectRequest> {
    return this.http.patch<ProjectRequest>(
      `/api/project-requests/${id}/estimate`,
      dto,
    );
  }

  downloadQuotePdf(id: string): Observable<{ filename: string; content: string }> {
    return this.http.get<{ filename: string; content: string }>(
      `/api/project-requests/${id}/quote/pdf`,
    );
  }

  addQuoteItem(
    projectId: string,
    dto: CreateQuoteItemPayload,
  ): Observable<ProjectRequest> {
    return this.http.post<ProjectRequest>(
      `/api/project-requests/${projectId}/items`,
      dto,
    );
  }

  removeQuoteItem(itemId: string): Observable<ProjectRequest> {
    return this.http.delete<ProjectRequest>(
      `/api/project-requests/items/${itemId}`,
    );
  }
}
