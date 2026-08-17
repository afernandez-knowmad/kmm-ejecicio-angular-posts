import { inject } from '@angular/core';
import { CanMatchFn, Router, Route, UrlSegment, UrlTree } from '@angular/router';

import { AuthStore } from './auth.store';

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
