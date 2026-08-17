import { inject } from '@angular/core';

import type { OwnedResource, OwnershipResolver } from '@features/auth/ownership.guard';
import { PostsApi } from './posts.api';

// `inject()` requiere InjectionContext: se llama desde un CanMatchFn.
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
