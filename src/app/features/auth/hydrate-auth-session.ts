import type { AuthStore } from './auth.store';
import { AuthSessionStorage } from './auth.session-storage';
import type { AuthSession } from './auth.types';

/**
 * Hydrate AuthStore from localStorage. Safe to call on app start.
 *
 * Exposed as a free function (not a service) because it composes two
 * existing singletons and has no state of its own. Callers wire it from
 * the app bootstrap.
 */
export function hydrateAuthSession(
  store: AuthStore,
  storage: AuthSessionStorage,
): AuthSession | null {
  const session = storage.read();
  if (!session) {
    return null;
  }
  store.hydrate(session);
  return session;
}
