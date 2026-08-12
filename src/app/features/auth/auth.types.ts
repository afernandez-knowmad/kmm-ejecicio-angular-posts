import type { PublicUser } from './models/user.model';

/**
 * Persisted auth session. Only safe-to-store fields, never passwords.
 */
export interface AuthSession {
  readonly token: string;
  readonly user: PublicUser;
}

/**
 * Possible errors raised by `AuthStore.login`. UI maps each to a
 * transloco key under `auth.errors.*`.
 */
export type AuthError = 'unknown-user' | 'wrong-password' | 'network-error' | 'unknown';
