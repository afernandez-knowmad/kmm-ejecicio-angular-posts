import type { PublicUser } from './models/user.model';

/**
 * Sesión persistida. Solo campos seguros para guardar, nunca
 * passwords.
 */
export interface AuthSession {
  readonly token: string;
  readonly user: PublicUser;
}

/**
 * Posibles errores de `AuthStore.login`. La UI mapea cada uno a una
 * clave de transloco bajo `auth.errors.*`.
 */
export type AuthError = 'unknown-user' | 'wrong-password' | 'network-error' | 'unknown';
