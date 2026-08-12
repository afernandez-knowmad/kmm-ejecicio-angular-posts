import { inject } from '@angular/core';

import { OwnedResource, OwnershipResolver } from '../auth/ownership.guard';
import { PostsApi } from './posts.api';

/**
 * Returns an OwnershipResolver suitable for `ownershipGuardFor` that
 * fetches a post by id and projects it to the { userId } shape the
 * guard expects.
 */
export const postsOwnershipResolver: OwnershipResolver = ((id: string) =>
  inject(PostsApi)
    .getById(id)
    .then((p) => p as OwnedResource)) as OwnershipResolver;
