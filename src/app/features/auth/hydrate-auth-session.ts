import { inject, provideAppInitializer } from '@angular/core';

import { AuthSessionStorage } from './auth.session-storage';
import type { AuthSession } from './auth.types';
import { AuthStore } from './auth.store';

/**
 * Hydrate AuthStore from localStorage and return the loaded session
 * (or null). Exposed as a free function because it composes two
 * existing singletons; callers wrap it in their own initialization
 * step (see initAuthHydration).
 */
export function hydrateAuthSession(): AuthSession | null {
  const storage = inject(AuthSessionStorage);
  const store = inject(AuthStore);
  const session = storage.read();
  if (!session) {
    return null;
  }
  store.hydrate(session);
  return session;
}

/**
 * APP_INITIALIZER-friendly variant: returns void once hydration is
 * done. Use this with `provideAppInitializer(initAuthHydration)`.
 */
export function initAuthHydration(): void {
  hydrateAuthSession();
}

/**
 * APP_INITIALIZER provider that rehydrates AuthStore from
 * localStorage before any route guard runs. Without this, a page
 * reload would always redirect to /login because the guard would
 * see an empty in-memory store even though a valid session exists
 * in localStorage.
 */
export const provideAuthHydration = () => provideAppInitializer(initAuthHydration);
