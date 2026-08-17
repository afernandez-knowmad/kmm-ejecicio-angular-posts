import { inject, provideAppInitializer } from '@angular/core';

import { AuthSessionStorage } from './auth.session-storage';
import type { AuthSession } from './auth.types';
import { AuthStore } from './auth.store';

/**
 * Hidrata el AuthStore desde localStorage y devuelve la sesión
 * cargada (o null). Función libre porque compone dos singletons
 * existentes; los callers la envuelven en su propio init.
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
 * Variante apta para APP_INITIALIZER: devuelve void al terminar.
 * Úsala con `provideAppInitializer(initAuthHydration)`.
 */
export function initAuthHydration(): void {
  hydrateAuthSession();
}

/**
 * Provider APP_INITIALIZER que rehidrata el AuthStore desde
 * localStorage antes de que corran los guards. Sin esto, un reload
 * redirigiría siempre a `/login` porque el guard vería el store
 * vacío aunque haya sesión válida persistida.
 */
export const provideAuthHydration = () => provideAppInitializer(initAuthHydration);
