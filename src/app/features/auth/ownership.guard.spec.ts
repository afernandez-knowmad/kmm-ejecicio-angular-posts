import { TestBed } from '@angular/core/testing';
import { Route, Router, UrlSegment, UrlTree } from '@angular/router';

import { ownershipGuardFor, type OwnershipResolver } from './ownership.guard';
import { AuthStore } from './auth.store';
import { provideTestApp } from '@core/testing/test-providers';
import type { PublicUser } from './models/user.model';

const ALICE: PublicUser = { id: '1', name: 'alice', email: '', avatar: '' };
const BRUNO: PublicUser = { id: '2', name: 'bruno', email: '', avatar: '' };

describe('ownershipGuardFor', () => {
  let store: AuthStore;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideTestApp() });
    store = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
  });

  function runGuard(resolver: OwnershipResolver, segments: string[]): Promise<boolean | UrlTree> {
    const guard = ownershipGuardFor('posts', resolver);
    const url = segments.map((p) => new UrlSegment(p, {}));
    return TestBed.runInInjectionContext(() =>
      guard({} as Route, url, undefined as never),
    ) as Promise<boolean | UrlTree>;
  }

  it('allows the owner through', async () => {
    store.hydrate({ token: 'mock-token-1', user: ALICE });
    const resolver = vi.fn().mockResolvedValue({ userId: '1' });

    const result = await runGuard(resolver, ['posts', '42', 'edit']);

    expect(result).toBe(true);
  });

  it('redirects non-owners to the read-only view with forbidden=1', async () => {
    store.hydrate({ token: 'mock-token-2', user: BRUNO });
    const resolver = vi.fn().mockResolvedValue({ userId: '1' });

    const result = await runGuard(resolver, ['posts', '42', 'edit']);

    expect(result).toBeInstanceOf(UrlTree);
    const tree = result as UrlTree;
    const serialized = router.serializeUrl(tree);
    expect(serialized).toContain('/posts/42');
    expect(serialized).not.toContain('/edit');
    expect(tree.queryParams['forbidden']).toBe('1');
  });

  it('sends unauthenticated users to /login', async () => {
    const resolver = vi.fn().mockResolvedValue({ userId: '1' });

    const result = await runGuard(resolver, ['posts', '42', 'edit']);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toContain('/login');
  });

  it('redirects to the base path when the resource cannot be resolved', async () => {
    store.hydrate({ token: 'mock-token-1', user: ALICE });
    const resolver = vi.fn().mockResolvedValue(null);

    const result = await runGuard(resolver, ['posts', '42', 'edit']);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toContain('/posts/42');
  });

  it('is robust against resource load failures', async () => {
    store.hydrate({ token: 'mock-token-1', user: ALICE });
    const resolver = vi.fn().mockImplementation(() => Promise.resolve(null));

    const result = await runGuard(resolver, ['posts', '42', 'edit']);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toContain('/posts/42');
  });
});
