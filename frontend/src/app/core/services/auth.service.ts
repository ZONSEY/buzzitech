import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from '../models/user.model';
import { CartService } from './cart.service';
import { WishlistService } from './wishlist.service';

const ACCESS_TOKEN_KEY = 'buzz_access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly cartService = inject(CartService);
  private readonly wishlistService = inject(WishlistService);

  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = signal<boolean>(false);

  // Le cookie httpOnly du refresh token est géré par authInterceptor
  // (withCredentials: true sur toute requête /api), pas ici.

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/auth/register', payload)
      .pipe(tap((res) => this.setSession(res)));
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/auth/login', payload)
      .pipe(tap((res) => this.setSession(res)));
  }

  me(): Observable<User> {
    return this.http
      .get<User>('/api/auth/me')
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  /** Échange le cookie de refresh contre un nouvel access token. */
  refresh(): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/auth/refresh', {})
      .pipe(tap((res) => this.setSession(res)));
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/forgot-password', {
      email,
    });
  }

  resetPassword(
    token: string,
    password: string,
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/reset-password', {
      token,
      password,
    });
  }

  verifyEmail(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/verify-email', {
      token,
    });
  }

  resendVerification(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      '/api/auth/resend-verification',
      {},
    );
  }

  logout(): void {
    this.http.post('/api/auth/logout', {}).subscribe({
      complete: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  /** Restaure la session au démarrage si un access token est présent. */
  restoreSession(): void {
    const token = this.getAccessToken();
    if (!token) {
      return;
    }
    this.me().subscribe({
      next: () => this.isAuthenticated.set(true),
      error: () => this.clearSession(),
    });
  }

  getAccessToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  private setSession(res: AuthResponse): void {
    if (this.isBrowser) {
      localStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    }
    this.currentUser.set(res.user);
    this.isAuthenticated.set(true);
  }

  private clearSession(): void {
    if (this.isBrowser) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    // Ces données sont propres à l'utilisateur connecté : on les vide
    // pour ne pas les montrer, même un instant, au prochain utilisateur
    // qui se connecterait sur ce même appareil.
    this.cartService.reset();
    this.wishlistService.reset();
  }
}
