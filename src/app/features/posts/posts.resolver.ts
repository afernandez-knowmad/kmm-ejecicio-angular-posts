import { inject } from '@angular/core';

import type { OwnedResource, OwnershipResolver } from '../auth/ownership.guard';
import { PostsApi } from './posts.api';

/**
 * Returns an OwnershipResolver that fetches a post by id and projects
 * it to the { userId } shape expected by ownershipGuardFor.
 *
 * `inject()` requires an InjectionContext, so this must be called from
 * inside a CanMatchFn (or a similar injection-aware function). The
 * resolver itself is then created lazily per route activation.
 */
export function injectPostsOwnershipResolver(): OwnershipResolver {
  const api = inject(PostsApi);
  return async (id: string): Promise<OwnedResource | null> => {
    try {
      const post = await api.getById(id);
      return { userId: post.userId };
    } catch {
      return null;
    }
  };
}
