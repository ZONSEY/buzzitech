import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { apiResponseInterceptor } from './core/api-response.interceptor';
import { authInterceptor } from './core/auth.interceptor';
import { apiBaseUrlInterceptor } from './core/api-base-url.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      // apiBaseUrlInterceptor en dernier : les deux autres s'appuient
      // sur req.url commençant par '/api', donc il doit réécrire l'URL
      // seulement une fois qu'ils l'ont déjà lue.
      withInterceptors([
        authInterceptor,
        apiResponseInterceptor,
        apiBaseUrlInterceptor,
      ]),
    ),
    provideClientHydration(),
  ],
};
