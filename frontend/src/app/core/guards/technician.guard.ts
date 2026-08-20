import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const technicianGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.getAccessToken()) {
    return router.createUrlTree(['/espace-client/connexion']);
  }

  const cached = authService.currentUser();
  if (cached) {
    return cached.role === 'TECHNICIEN'
      ? true
      : router.createUrlTree(['/espace-client']);
  }

  return authService.me().pipe(
    map((user) =>
      user.role === 'TECHNICIEN'
        ? true
        : router.createUrlTree(['/espace-client']),
    ),
    catchError(() => of(router.createUrlTree(['/espace-client/connexion']))),
  );
};
