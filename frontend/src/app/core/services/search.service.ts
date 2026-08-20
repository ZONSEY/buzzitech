import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SearchResults } from '../models/search.model';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);

  search(q: string): Observable<SearchResults> {
    return this.http.get<SearchResults>('/api/search', {
      params: new HttpParams().set('q', q),
    });
  }
}
