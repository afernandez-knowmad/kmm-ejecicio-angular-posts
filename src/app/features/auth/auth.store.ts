import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { toId } from '@core/lib/ids';
import { AuthApi } from './auth.api';
import { AuthSessionStorage } from './auth.session-storage';
import type { AuthError } from './auth.types';
import type { LoginCredentials, PublicUser } from './models/user.model';

/**
 * In-memory auth store. Holds the active session as signals so the rest
 * of the app can react to login/logout changes without subscribing.
 *
 * Persistence (localStorage) is owned here as well: an effect mirrors
 * the (user, token) pair into AuthSessionStorage so that reloads
 * automatically restore the session.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthApi);
  private readonly storage = inject(AuthSessionStorage);

  private readonly _user = signal<PublicUser | null>(null);
  private readonly _token = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<AuthError | null>(null);

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null && this._token() !== null);

  constructor() {
    // Sync the (user, token) pair into localStorage on every change.
    // Running inside an InjectionContext is enough since the store is
    // providedIn root and instantiated lazily.
    effect(() => {
      const user = this._user();
      const token = this._token();
      if (user && token) {
        this.storage.write({ user, token });
      } else {
        this.storage.clear();
      }
    });
  }

  /**
   * Attempt to log in with the provided credentials.
   *
   * Resolves to the authenticated `PublicUser` on success, or rejects
   * with an `AuthError` code that the UI maps to a transloco key.
   */
  async login(credentials: LoginCredentials): Promise<PublicUser> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const matches = await this.api.findByNameOnce(credentials.name.trim());
      const user = matches[0];
      if (!user) {
        this._error.set('unknown-user');
        throw new Error('unknown-user');
      }
      if (user.password !== credentials.password) {
        this._error.set('wrong-password');
        throw new Error('wrong-password');
      }

      const publicUser: PublicUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      };
      const token = this.makeToken(publicUser.id);

      this._user.set(publicUser);
      this._token.set(token);
      return publicUser;
    } catch (err) {
      if (this._error() === null) {
        // Only swallow genuine network errors; auth errors are already set.
        this._error.set(
          err instanceof Error && err.message === 'network' ? 'network-error' : 'unknown',
        );
      }
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Drop the active session.
   */
  logout(): void {
    this._user.set(null);
    this._token.set(null);
    this._error.set(null);
    this._loading.set(false);
  }

  /**
   * Replace the live state from a previously persisted session.
   *
   * Used by the localStorage hydration layer on app start.
   */
  hydrate(session: { token: string; user: PublicUser } | null): void {
    if (!session) {
      return;
    }
    this._user.set(session.user);
    this._token.set(session.token);
  }

  /**
   * Build the mock token used by the bearer interceptor.
   *
   * Deterministic so a hydrated session can be re-emitted with the
   * same token across reloads.
   */
  private makeToken(userId: string): string {
    return `mock-token-${toId(userId)}`;
  }
}
