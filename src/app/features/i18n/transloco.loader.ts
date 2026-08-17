import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Translation, TranslocoLoader } from '@jsverse/transloco';

/**
 * Carga los json de traducción desde `/assets/i18n/<lang>.json`.
 *
 * Los archivos se sirven como assets estáticos desde
 * `src/assets/i18n/` por la build config de Angular (ver
 * `angular.json` -> `assets`). Build rápida, loader trivial.
 */
@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string): ReturnType<TranslocoLoader['getTranslation']> {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}
