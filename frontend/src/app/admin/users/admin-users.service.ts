import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, UserRole } from '../../core/models/user.model';

export interface AdminUserFilter {
  page?: number;
  search?: string;
  role?: UserRole | '';
}

interface PaginatedUsers {
  data: User[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly http = inject(HttpClient);

  findAll(filter: AdminUserFilter): Observable<PaginatedUsers> {
    let params = new HttpParams().set('page', filter.page ?? 1).set('limit', 15);
    if (filter.search) {
      params = params.set('search', filter.search);
    }
    if (filter.role) {
      params = params.set('role', filter.role);
    }

    return this.http.get<PaginatedUsers>('/api/users', { params });
  }

  updateRole(id: string, role: UserRole): Observable<User> {
    return this.http.patch<User>(`/api/users/${id}/role`, { role });
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/users/${id}`);
  }
}
