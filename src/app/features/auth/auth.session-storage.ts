import { Injectable } from '@angular/core';

import type { AuthSession } from './auth.types';
import type { PublicUser } from './models/user.model';

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
