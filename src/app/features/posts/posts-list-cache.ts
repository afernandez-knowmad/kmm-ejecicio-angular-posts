import { Injectable, computed, signal } from '@angular/core';

import type { Post } from './models/post.model';

/**
 * In-memory cache of posts observed by the list page.
 *
 * Lives outside the httpResource value so component-level effects
 * (tag chips) can read accumulated state without triggering a refetch.
 */
@Injectable({ providedIn: 'root' })
export class PostsListCache {
  private readonly _seenPosts = signal<readonly Post[]>([]);

  /**
   * Distinct tags collected from every post observed so far, sorted
   * alphabetically for stable rendering.
   */
  readonly availableTags = computed<readonly string[]>(() => {
    const set = new Set<string>();
    for (const p of this._seenPosts()) {
      for (const t of p.tags) {
        set.add(t);
      }
    }
    return Array.from(set).sort();
  });

  observe(posts: readonly Post[]): void {
    this._seenPosts.set([...this._seenPosts(), ...posts]);
  }
}
