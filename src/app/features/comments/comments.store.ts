import { Injectable, computed, signal } from '@angular/core';

import type { Comment } from './models/comment.model';

/**
 * In-memory cache of comments indexed by postId.
 *
 * The container feeds the cache from httpResource values and the
 * create/update/delete handlers read from it to keep the UI in sync
 * without a full refetch. Persistence is intentionally omitted:
 * json-server keeps the source of truth.
 */
@Injectable({ providedIn: 'root' })
export class CommentsStore {
  private readonly _byPost = signal<ReadonlyMap<string, readonly Comment[]>>(new Map());

  /** Readonly view of the entire cache, keyed by postId. */
  readonly byPost = this._byPost.asReadonly();

  /** Comments for a single postId as a reactive computed signal. */
  forPost(postId: () => string) {
    return computed(() => this._byPost().get(postId()) ?? []);
  }

  observe(postId: string, comments: readonly Comment[]): void {
    const next = new Map(this._byPost());
    next.set(postId, [...comments]);
    this._byPost.set(next);
  }

  prepend(postId: string, comment: Comment): void {
    const existing = this._byPost().get(postId) ?? [];
    this.observe(postId, [comment, ...existing]);
  }

  replace(postId: string, comment: Comment): void {
    const existing = this._byPost().get(postId) ?? [];
    this.observe(
      postId,
      existing.map((c) => (c.id === comment.id ? comment : c)),
    );
  }

  remove(postId: string, id: string): void {
    const existing = this._byPost().get(postId) ?? [];
    this.observe(
      postId,
      existing.filter((c) => c.id !== id),
    );
  }

  clear(postId: string): void {
    const next = new Map(this._byPost());
    next.delete(postId);
    this._byPost.set(next);
  }
}
