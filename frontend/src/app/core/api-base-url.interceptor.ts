import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable } from 'rxjs';

// Window.__env est déclaré globalement dans src/types/window.d.ts.

/**
 * Réécrit les requêtes /api/... vers une origine absolue quand le
 * frontend et le backend ne sont pas servis sous le même domaine (ex:
 * déploiement Railway sans nginx unificateur). En local/Docker Compose,
 * env.js définit apiBaseUrl à une chaîne vide et les requêtes restent
 * relatives, inchangées (proxy nginx same-origin).
 */
export function apiBaseUrlInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  const baseUrl = isBrowser ? window.__env?.apiBaseUrl : undefined;

  if (!baseUrl || !req.url.startsWith('/api')) {
    return next(req);
  }

  return next(req.clone({ url: baseUrl.replace(/\/$/, '') + req.url }));
}
