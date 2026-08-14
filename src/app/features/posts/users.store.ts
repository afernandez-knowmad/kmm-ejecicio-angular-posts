import { Injectable, computed, inject, signal } from '@angular/core';

import type { PublicUser } from '@features/auth/models/user.model';
import { UsersApi } from './users.api';

/**
 * Caches the list of users so the posts list and post detail can show
 * author info without refetching on every render.
 *
 * `loaded` flips to true after the first successful fetch. Components
 * call `ensureLoaded()` from their constructor and then read `byId`
 * synchronously.
 */
@Injectable({ providedIn: 'root' })
export class UsersStore {
  private readonly api = inject(UsersApi);

  private readonly _users = signal<readonly PublicUser[]>([]);
  private readonly _loaded = signal(false);
  private inflight: Promise<void> | null = null;

  readonly users = this._users.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly byId = computed(() => {
    const map = new Map<string, PublicUser>();
    for (const u of this._users()) {
      map.set(u.id, u);
    }
    return map;
  });

  /**
   * Trigger the fetch if it has not happened yet. Concurrent callers
   * share the same promise.
   */
  ensureLoaded(): Promise<void> {
    if (this._loaded()) {
      return Promise.resolve();
    }
    if (this.inflight) {
      return this.inflight;
    }
    this.inflight = this.api.listAll().then((users) => {
      this._users.set(users);
      this._loaded.set(true);
    });
    return this.inflight;
  }
}
