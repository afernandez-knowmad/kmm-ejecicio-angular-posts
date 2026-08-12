import { inject } from '@angular/core';
import { CanMatchFn, Router, Route, UrlSegment, UrlTree } from '@angular/router';

import { AuthStore } from './auth.store';

/**
 * Allows navigation only when an auth session exists. Otherwise it
 * redirects to /login, preserving the original URL as `redirectTo` so
 * the user lands back where they wanted after signing in.
 *
 * Implemented as a `CanMatchFn` so the route is not even matched when
 * the user is not authenticated (skips lazy-loading entirely).
 */
export const authGuard: CanMatchFn = (_route: Route, segments: UrlSegment[]): boolean | UrlTree => {
  const store = inject(AuthStore);
  const router = inject(Router);

  if (store.isAuthenticated()) {
    return true;
  }

  const attemptedUrl = '/' + segments.map((s) => s.path).join('/');
  return router.createUrlTree(['/login'], {
    queryParams: { redirectTo: attemptedUrl },
  });
};
