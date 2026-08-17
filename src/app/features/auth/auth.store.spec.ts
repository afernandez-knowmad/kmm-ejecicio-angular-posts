import { TestBed } from '@angular/core/testing';

import { AuthApi } from './auth.api';
import { AuthSessionStorage } from './auth.session-storage';
import { AuthStore } from './auth.store';
import { provideTestApp } from '@core/testing/test-providers';
import type { PublicUser } from './models/user.model';

const ALICE: PublicUser = {
  id: '1',
  name: 'alice',
  email: 'alice@example.com',
  avatar: 'https://example.com/alice.svg',
};

const ALICE_RECORD = { ...ALICE, password: 'alice123' };

class InMemoryStorage {
  private session: { token: string; user: PublicUser } | null = null;
  read() {
    return this.session;
  }
  write(session: { token: string; user: PublicUser }) {
    this.session = session;
  }
  clear() {
    this.session = null;
  }
}

describe('AuthStore', () => {
  let store: AuthStore;
  let api: { findByNameOnce: ReturnType<typeof vi.fn> };
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
    api = { findByNameOnce: vi.fn() };

    TestBed.configureTestingModule({
      providers: provideTestApp([
        { provide: AuthApi, useValue: api },
        { provide: AuthSessionStorage, useValue: storage },
      ]),
    });

    store = TestBed.inject(AuthStore);
  });

  it('starts unauthenticated', () => {
    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
    expect(store.token()).toBeNull();
  });

  it('logs in with valid credentials and persists the session', async () => {
    api.findByNameOnce.mockResolvedValue([ALICE_RECORD]);

    const user = await store.login({ name: 'alice', password: 'alice123' });

    expect(user).toEqual(ALICE);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.token()).toBe('mock-token-1');
    expect(store.loading()).toBe(false);

    await vi.waitFor(() => {
      expect(storage.read()?.user).toEqual(ALICE);
    });
  });

  it('rejects unknown users with the right error code', async () => {
    api.findByNameOnce.mockResolvedValue([]);

    await expect(store.login({ name: 'ghost', password: 'whatever' })).rejects.toThrow(
      'unknown-user',
    );

    expect(store.error()).toBe('unknown-user');
    expect(store.isAuthenticated()).toBe(false);
  });

  it('rejects wrong passwords with the right error code', async () => {
    api.findByNameOnce.mockResolvedValue([ALICE_RECORD]);

    await expect(store.login({ name: 'alice', password: 'NOT_MINE' })).rejects.toThrow(
      'wrong-password',
    );

    expect(store.error()).toBe('wrong-password');
    expect(store.isAuthenticated()).toBe(false);
  });

  it('clears the session on logout', async () => {
    api.findByNameOnce.mockResolvedValue([ALICE_RECORD]);
    await store.login({ name: 'alice', password: 'alice123' });

    store.logout();

    expect(store.isAuthenticated()).toBe(false);
    expect(store.user()).toBeNull();
    expect(store.token()).toBeNull();
    expect(storage.read()).toBeNull();
  });

  it('hydrates from a previously persisted session', async () => {
    storage.write({ token: 'mock-token-1', user: ALICE });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: provideTestApp([
        { provide: AuthApi, useValue: api },
        { provide: AuthSessionStorage, useValue: storage },
      ]),
    });

    const fresh = TestBed.inject(AuthStore);
    fresh.hydrate(storage.read());

    expect(fresh.isAuthenticated()).toBe(true);
    expect(fresh.user()).toEqual(ALICE);
    expect(fresh.token()).toBe('mock-token-1');
  });

  it('hydrating with a null session is a no-op', () => {
    store.hydrate(null);

    expect(store.isAuthenticated()).toBe(false);
  });
});
