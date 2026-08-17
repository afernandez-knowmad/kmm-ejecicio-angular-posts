import type { PublicUser } from './models/user.model';

export interface AuthSession {
  readonly token: string;
  readonly user: PublicUser;
}

export type AuthError = 'unknown-user' | 'wrong-password' | 'network-error' | 'unknown';
