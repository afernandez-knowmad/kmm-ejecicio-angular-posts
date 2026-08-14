import { TestBed } from '@angular/core/testing';
import { Route, Router, UrlSegment, UrlTree } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthStore } from './auth.store';
import { provideTestApp } from '@core/testing/test-providers';
import type { PublicUser } from './models/user.model';

const ALICE: PublicUser = {
  id: '1',
  name: 'alice',
  email: 'alice@example.com',
  avatar: '',
};

describe('authGuard', () => {
  let store: AuthStore;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: provideTestApp() });
    store = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
  });

  function run(segments: string[]): boolean | UrlTree {
    const url = segments.map((p) => new UrlSegment(p, {}));
    return TestBed.runInInjectionContext(() => authGuard({} as Route, url, undefined as never)) as
      boolean | UrlTree;
  }

  it('allows authenticated users through', () => {
    store.hydrate({ token: 'mock-token-1', user: ALICE });

    expect(run(['posts', '42'])).toBe(true);
  });

  it('redirects anonymous users to /login with the original URL in redirectTo', () => {
    const result = run(['posts', '42']);

    expect(result).toBeInstanceOf(UrlTree);
    const tree = result as UrlTree;
    expect(router.serializeUrl(tree)).toContain('/login');
    expect(tree.queryParams['redirectTo']).toBe('/posts/42');
  });

  it('preserves multi-segment attempted URLs', () => {
    const result = run(['posts', '42', 'edit']);

    const tree = result as UrlTree;
    expect(tree.queryParams['redirectTo']).toBe('/posts/42/edit');
  });
});
