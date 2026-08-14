import { provideHttpClient } from '@angular/common/http';
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';

import { API_BASE_URL } from '@core/http/api-base-url.token';

/**
 * Reusable providers for unit tests.
 *
 * The production app injects `API_BASE_URL` from `app.config.ts`. In
 * tests we point it at a deterministic placeholder so any service that
 * builds URLs can still resolve the token without throwing NG0201.
 *
 * Transloco is wired with a no-op translation object so components
 * that pipe `| transloco` can render without throwing on missing
 * translations. Real i18n is exercised in the e2e suite.
 *
 * Returns the union of `EnvironmentProviders` (router, http client,
 * transloco) and `Provider` (the token) so callers can spread it
 * directly into `TestBed.configureTestingModule({ providers: ... })`.
 */
export function provideTestApp(
  extra: (Provider | EnvironmentProviders)[] = [],
): (Provider | EnvironmentProviders)[] {
  return [
    provideRouter([]),
    provideHttpClient(),
    provideTransloco({ config: { defaultLang: 'es', fallbackLang: 'es' } }),
    { provide: API_BASE_URL, useValue: 'http://mock' },
    ...extra,
  ];
}
