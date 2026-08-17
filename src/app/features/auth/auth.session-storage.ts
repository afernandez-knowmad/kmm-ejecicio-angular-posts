import { Injectable } from '@angular/core';

import type { AuthSession } from './auth.types';
import type { PublicUser } from './models/user.model';

/**
 * Adaptador de localStorage para la sesión.
 *
 * Pequeño a propósito: solo sabe leer/escribir JSON; el store
 * decide cuándo llamarlo. Así los tests no necesitan fake de DI y
 * la clave se cambia fácil si hace falta.
 */
@Injectable({ providedIn: 'root' })
export class AuthSessionStorage {
  private readonly storageKey = 'app.auth.session';

  read(): AuthSession | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<AuthSession> | null;
      if (!parsed || typeof parsed.token !== 'string' || !parsed.user) {
        return null;
      }
      const user = parsed.user as PublicUser;
      return { token: parsed.token, user };
    } catch {
      // Payload corrupto: lo tiramos para no bloquear al usuario.
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  write(session: AuthSession): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  clear(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.removeItem(this.storageKey);
  }
}
