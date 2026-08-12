import { InjectionToken } from '@angular/core';

/**
 * Base URL of the mock backend (json-server).
 *
 * Provided in `app.config.ts` and consumed by feature services so they do
 * not hard-code the origin. Keeping it as a token makes it trivial to swap
 * in tests with a different value (in-memory server, fixtures, etc.).
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
