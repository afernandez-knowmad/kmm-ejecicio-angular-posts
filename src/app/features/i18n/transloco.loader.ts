import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Translation, TranslocoLoader } from '@jsverse/transloco';

/**
 * Loads translation files from `/assets/i18n/<lang>.json`.
 *
 * Files are served as static assets from `src/assets/i18n/` thanks to the
 * Angular build config (see `angular.json` -> `assets`). That keeps the
 * build fast and the loader trivial.
 */
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string): ReturnType<TranslocoLoader['getTranslation']> {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}
