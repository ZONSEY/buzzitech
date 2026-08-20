import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContactMessagePayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactMessageResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  answered: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  constructor(private readonly http: HttpClient) {}

  send(payload: ContactMessagePayload): Observable<ContactMessageResponse> {
    return this.http.post<ContactMessageResponse>(
      '/api/contact-messages',
      payload,
    );
  }
}
