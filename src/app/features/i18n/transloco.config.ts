import { provideTransloco, TranslocoConfig } from '@jsverse/transloco';

import { TranslocoHttpLoader } from './transloco.loader';

/**
 * Languages supported by the app. The first entry is the default.
 *
 * Adding a new locale is a two-step change:
 *   1. Drop the new json file under `src/assets/i18n/<code>.json`.
 *   2. Add the code to this array.
 */
export const SUPPORTED_LANGS = ['es', 'en'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: SupportedLang = 'es';

/**
 * localStorage key used to remember the user's language across reloads.
 */
export const LANG_STORAGE_KEY = 'app.lang';

/**
 * Transloco runtime configuration. Loaded eagerly so translations are
 * available on first paint.
 *
 * `availableLangs` is given a spread copy because Transloco's type
 * expects a mutable array of `LangDefinition`.
 */
export const translocoConfig: TranslocoConfig = {
  availableLangs: [...SUPPORTED_LANGS],
  defaultLang: DEFAULT_LANG,
  fallbackLang: DEFAULT_LANG,
  reRenderOnLangChange: true,
  prodMode: true,
  // Sensible defaults that match Transloco's own starter config.
  failedRetries: 2,
  flatten: {
    aot: false,
  },
  missingHandler: {
    logMissingKey: true,
    useFallbackTranslation: true,
    allowEmpty: true,
  },
  interpolation: ['{{', '}}'],
  scopes: {},
};

/**
 * App-level Transloco providers. Wires Transloco with the http loader
 * pointed at `src/assets/i18n/<lang>.json` (served at `/assets/i18n/...`
 * by Angular's build config in `angular.json`).
 */
export const provideAppTransloco = () =>
  provideTransloco({
    config: translocoConfig,
    loader: TranslocoHttpLoader,
  });
