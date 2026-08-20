import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Address, AddressPayload } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class AddressesService {
  private readonly http = inject(HttpClient);

  findAll(): Observable<Address[]> {
    return this.http.get<Address[]>('/api/addresses');
  }

  create(dto: AddressPayload): Observable<Address> {
    return this.http.post<Address>('/api/addresses', dto);
  }

  update(id: string, dto: Partial<AddressPayload>): Observable<Address> {
    return this.http.patch<Address>(`/api/addresses/${id}`, dto);
  }

  setDefault(id: string): Observable<Address> {
    return this.http.patch<Address>(`/api/addresses/${id}/default`, {});
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`/api/addresses/${id}`);
  }
}
