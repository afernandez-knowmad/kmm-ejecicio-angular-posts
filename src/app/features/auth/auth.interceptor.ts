import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthStore } from './auth.store';

/**
 * Functional HTTP interceptor that attaches the bearer token from
 * `AuthStore` to every outgoing request, when a session exists.
 *
 * Requests without a session are left untouched so that anonymous
 * endpoints (the `/users?` login lookup) keep working.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(AuthStore);
  const token = store.token();

  if (!token) {
    return next(req);
  }

  const authed = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
  return next(authed);
};
