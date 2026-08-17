import { InjectionToken } from '@angular/core';

/**
 * URL base del backend mock (json-server).
 *
 * Se aporta desde `app.config.ts` y la consumen los servicios de las
 * features para no acoplar el origen a cada uno. Tokenizarlo hace
 * trivial cambiarlo en tests.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
