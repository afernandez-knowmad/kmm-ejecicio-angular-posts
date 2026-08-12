import { inject } from '@angular/core';
import { CanMatchFn, Route, Router, UrlSegment, UrlTree } from '@angular/router';

import { isOwner } from '../../core/lib/ids';
import { AuthStore } from './auth.store';

/**
 * Resource shape required by the ownership resolver.
 *
 * Anything that has a `userId` works. Kept as a structural type so
 * `Post`, `Comment` and any future resource can satisfy it without
 * inheritance.
 */
export interface OwnedResource {
  readonly userId: string;
}

/**
 * Resolver signature: given the :id from the URL, fetch the resource
 * and return its userId. Resolvers are expected to throw or return
 * `null` if the resource cannot be loaded.
 */
export type OwnershipResolver = (id: string) => Promise<OwnedResource | null>;

/**
 * Build a `CanMatchFn` that checks whether the authenticated user is the
 * owner of the resource referenced by the `:id` route parameter.
 *
 * Usage:
 *
 * ```ts
 * {
 *   path: 'posts/:id/edit',
 *   canMatch: [ownershipGuardFor(id => postsApi.findOne(id))],
 *   loadComponent: () => import('./edit.page'),
 * }
 * ```
 *
 * On failure it redirects to the read-only view (`/<base>/:id`) so the
 * user can still browse the resource; a separate `forbidden` signal in
 * the page handles the UI feedback.
 */
export function ownershipGuardFor(basePath: string, resolver: OwnershipResolver): CanMatchFn {
  return async (
    route: Route,
    segments: UrlSegment[],
    // The third CanMatchFn parameter is required by the signature
    // but unused by this guard; suppressed via config in eslint.config.
    snapshot: Parameters<CanMatchFn>[2],
  ): Promise<boolean | UrlTree> => {
    void snapshot;
    void route;
    const store = inject(AuthStore);
    const router = inject(Router);

    if (!store.isAuthenticated()) {
      // Defer to authGuard for anonymous users; this guard should
      // never run before authentication is established.
      return router.createUrlTree(['/login']);
    }

    const id = segments.find((s) => s.path !== basePath)?.path ?? '';
    if (!id) {
      return router.createUrlTree([basePath]);
    }

    const resource = await resolver(id);
    if (!resource) {
      return router.createUrlTree([basePath, id]);
    }

    const currentUserId = store.user()?.id;
    if (isOwner(resource.userId, currentUserId)) {
      return true;
    }

    return router.createUrlTree([basePath, id], {
      queryParams: { forbidden: 1 },
    });
  };
}
