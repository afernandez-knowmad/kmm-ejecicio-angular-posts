import { provideTransloco, TranslocoConfig } from '@jsverse/transloco';

import { TranslocoHttpLoader } from './transloco.loader';

export const SUPPORTED_LANGS = ['es', 'en'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: SupportedLang = 'es';

export const LANG_STORAGE_KEY = 'app.lang';

// `availableLangs` recibe un spread porque el tipo de Transloco
// espera un array mutable de `LangDefinition`.
export const translocoConfig: TranslocoConfig = {
  availableLangs: [...SUPPORTED_LANGS],
  defaultLang: DEFAULT_LANG,
  fallbackLang: DEFAULT_LANG,
  reRenderOnLangChange: true,
  prodMode: true,
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

export const provideAppTransloco = () =>
  provideTransloco({
    config: translocoConfig,
    loader: TranslocoHttpLoader,
  });
