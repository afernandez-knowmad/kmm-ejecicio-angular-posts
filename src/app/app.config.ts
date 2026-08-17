import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, TitleStrategy, withViewTransitions } from '@angular/router';

import { API_BASE_URL } from '@core/http/api-base-url.token';
import { TranslocoTitleStrategy } from '@core/i18n/transloco-title.strategy';
import { routes } from './app.routes';
import { provideAuthHydration } from '@features/auth/hydrate-auth-session';
import { authInterceptor } from '@features/auth/auth.interceptor';
import { provideAppTransloco } from '@features/i18n/transloco.config';

// Origen por defecto del backend mock que levanta `npm start`. En tests
// se sobreescribe el token API_BASE_URL desde el TestBed.
const DEFAULT_API_BASE_URL = 'http://localhost:3000';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppTransloco(),
    { provide: API_BASE_URL, useValue: DEFAULT_API_BASE_URL },
    provideAuthHydration(),
    // Sustituye el TitleStrategy por defecto para tratar el `title`
    // de cada ruta como clave de Transloco y añadirle el sufijo ` | TechPoC`.
    { provide: TitleStrategy, useClass: TranslocoTitleStrategy },
  ],
};
