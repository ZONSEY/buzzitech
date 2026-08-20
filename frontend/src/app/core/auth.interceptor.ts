import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthResponse } from './models/user.model';
import { AuthService } from './services/auth.service';

// Partagé entre toutes les requêtes en cours : évite de déclencher
// plusieurs appels /api/auth/refresh en parallèle si plusieurs
// requêtes échouent en 401 au même moment.
let refreshInProgress$: Observable<AuthResponse> | null = null;

export function authInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);

  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  const isAuthEndpoint = req.url.startsWith('/api/auth/');
  const authedReq = attachToken(req, authService.getAccessToken());

  return next(authedReq).pipe(
    catchError((error: unknown) => {
      const isUnauthorized =
        error instanceof HttpErrorResponse && error.status === 401;

      // On ne tente jamais de rafraîchir suite à un échec des
      // endpoints d'auth eux-mêmes (login/register/refresh/logout),
      // sinon boucle infinie.
      if (!isUnauthorized || isAuthEndpoint) {
        return throwError(() => error);
      }

      return refreshAndRetry(req, next, authService);
    }),
  );
}

function attachToken(
  req: HttpRequest<unknown>,
  token: string | null,
): HttpRequest<unknown> {
  const withCreds = req.clone({ withCredentials: true });

  if (!token) {
    return withCreds;
  }

  return withCreds.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

function refreshAndRetry(
  originalReq: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
): Observable<HttpEvent<unknown>> {
  if (!refreshInProgress$) {
    refreshInProgress$ = authService.refresh().pipe(shareReplay(1));
  }

  return refreshInProgress$.pipe(
    switchMap((res) => {
      refreshInProgress$ = null;
      return next(attachToken(originalReq, res.accessToken));
    }),
    catchError((err) => {
      refreshInProgress$ = null;
      // Le refresh cookie est invalide/expiré : on nettoie la session
      // locale ; c'est aux guards/composants de rediriger vers la
      // connexion en réaction à isAuthenticated().
      authService.logout();
      return throwError(() => err);
    }),
  );
}
