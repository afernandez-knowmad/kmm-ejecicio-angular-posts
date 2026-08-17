import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { toId } from '@core/lib/ids';
import { AuthApi } from './auth.api';
import { AuthSessionStorage } from './auth.session-storage';
import type { AuthError } from './auth.types';
import type { LoginCredentials, PublicUser } from './models/user.model';

/**
 * Store de auth en memoria. Expone la sesión activa como signals
 * para que el resto reaccione a login/logout sin suscribirse.
 *
 * La persistencia (localStorage) vive aquí: un effect refleja el
 * par (user, token) en `AuthSessionStorage` para que un reload
 * restaure la sesión automáticamente.
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
    // Sincroniza el par (user, token) en localStorage en cada cambio.
    // Como el store es providedIn root y se instancia lazy, basta con
    // que el effect corra dentro de un InjectionContext.
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
   * Intenta login con las credenciales. Resuelve con el `PublicUser`
   * autenticado o rechaza con un código `AuthError` que la UI mapea
   * a una clave de transloco.
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
        // Solo cubrimos errores de red genuinos; los de auth ya están seteados.
        this._error.set(
          err instanceof Error && err.message === 'network' ? 'network-error' : 'unknown',
        );
      }
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /** Cierra la sesión activa. */
  logout(): void {
    this._user.set(null);
    this._token.set(null);
    this._error.set(null);
    this._loading.set(false);
  }

  /**
   * Sustituye el estado vivo por una sesión persistida. La usa la
   * capa de hidratación de localStorage al arrancar.
   */
  hydrate(session: { token: string; user: PublicUser } | null): void {
    if (!session) {
      return;
    }
    this._user.set(session.user);
    this._token.set(session.token);
  }

  /**
   * Genera el token mock que usa el interceptor. Es determinista
   * para que una sesión hidratada se reemita con el mismo token
   * tras cada recarga.
   */
  private makeToken(userId: string): string {
    return `mock-token-${toId(userId)}`;
  }
}
