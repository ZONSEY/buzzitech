import { HttpClient, HttpParams } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import {
  AppNotification,
  PaginatedNotifications,
} from '../models/notification.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  private socket: Socket | null = null;

  readonly unreadCount = signal(0);
  readonly latest = signal<AppNotification[]>([]);

  findMine(page = 1): Observable<PaginatedNotifications> {
    return this.http.get<PaginatedNotifications>('/api/notifications/me', {
      params: new HttpParams().set('page', page).set('limit', 20),
    });
  }

  markAsRead(id: string): Observable<AppNotification> {
    return this.http.patch<AppNotification>(
      `/api/notifications/${id}/read`,
      {},
    );
  }

  markAllAsRead(): Observable<unknown> {
    return this.http.patch('/api/notifications/read-all', {});
  }

  refreshUnreadCount(): void {
    this.http
      .get<number>('/api/notifications/unread-count')
      .subscribe({ next: (count) => this.unreadCount.set(count) });
  }

  /** Ouvre la connexion WebSocket et rejoint la room de l'utilisateur
   * connecté (authentifiée par son access token, vérifié côté serveur). */
  connect(): void {
    if (!isPlatformBrowser(this.platformId) || this.socket) {
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    // window.__env.apiBaseUrl (voir env.js / api-base-url.interceptor) :
    // même mécanisme que les appels HTTP pour pointer le WebSocket vers
    // l'API quand frontend et backend ne sont pas sur la même origine.
    const apiBaseUrl = window.__env?.apiBaseUrl;
    this.socket = apiBaseUrl
      ? io(apiBaseUrl, { path: '/socket.io' })
      : io({ path: '/socket.io' });

    this.socket.on('connect', () => {
      this.socket?.emit('join', { token });
    });

    this.socket.on('notification:new', (notification: AppNotification) => {
      this.latest.update((list) => [notification, ...list].slice(0, 20));
      this.unreadCount.update((count) => count + 1);
    });

    this.refreshUnreadCount();
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.unreadCount.set(0);
    this.latest.set([]);
  }
}
