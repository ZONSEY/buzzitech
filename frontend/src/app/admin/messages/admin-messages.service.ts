import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ContactMessageAdmin {
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
export class AdminMessagesService {
  private readonly http = inject(HttpClient);

  findAll(): Observable<ContactMessageAdmin[]> {
    return this.http.get<ContactMessageAdmin[]>('/api/contact-messages');
  }

  reply(id: string, message: string): Observable<ContactMessageAdmin> {
    return this.http.post<ContactMessageAdmin>(
      `/api/contact-messages/${id}/reply`,
      { message },
    );
  }
}
