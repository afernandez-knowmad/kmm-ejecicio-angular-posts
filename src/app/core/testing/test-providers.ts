import { provideHttpClient } from '@angular/common/http';
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';

import { API_BASE_URL } from '@core/http/api-base-url.token';

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
