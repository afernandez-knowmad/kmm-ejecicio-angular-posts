import { provideTransloco, TranslocoConfig } from '@jsverse/transloco';

/**
 * Languages supported by the app. The first entry is the default.
 *
 * Adding a new locale is a two-step change:
 *   1. Drop the new json file under `public/i18n/<code>.json`.
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
 */
export const translocoConfig: TranslocoConfig = {
  availableLangs: SUPPORTED_LANGS,
  defaultLang: DEFAULT_LANG,
  fallbackLang: DEFAULT_LANG,
  reRenderOnLangChange: true,
  prodMode: true,
};

/**
 * App-level Transloco providers. Wires Transloco with the http loader
 * pointed at `public/i18n/<lang>.json` (already served as a static
 * asset by Angular's build config).
 */
export const provideAppTransloco = () =>
  provideTransloco({
    config: translocoConfig,
    loader: () => import('./transloco.loader'),
  });
