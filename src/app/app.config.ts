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

/**
 * Default origin of the mock backend started by `npm start` via
 * `concurrently`. Tests can override this by providing their own
 * value for API_BASE_URL in the TestBed.
 */
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
    // The default Angular `TitleStrategy` paints the route's `title`
    // field verbatim. We override it so the field is treated as a
    // Transloco key and decorated with the ` | TechPoC` suffix.
    { provide: TitleStrategy, useClass: TranslocoTitleStrategy },
  ],
};
