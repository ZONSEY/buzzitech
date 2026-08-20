import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateProjectRequestPayload,
  ProjectRequest,
} from '../models/project-request.model';

@Injectable({ providedIn: 'root' })
export class ProjectRequestsService {
  private readonly http = inject(HttpClient);

  create(dto: CreateProjectRequestPayload): Observable<ProjectRequest> {
    return this.http.post<ProjectRequest>('/api/project-requests', dto);
  }

  findMine(): Observable<ProjectRequest[]> {
    return this.http.get<ProjectRequest[]>('/api/project-requests/my-requests');
  }

  findOne(id: string): Observable<ProjectRequest> {
    return this.http.get<ProjectRequest>(`/api/project-requests/${id}`);
  }

  downloadQuotePdf(id: string): Observable<{ filename: string; content: string }> {
    return this.http.get<{ filename: string; content: string }>(
      `/api/project-requests/${id}/quote/pdf`,
    );
  }
}
