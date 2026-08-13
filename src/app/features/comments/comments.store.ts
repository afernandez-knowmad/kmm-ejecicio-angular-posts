import { Injectable, computed, signal } from '@angular/core';

import type { Comment } from './models/comment.model';

/**
 * In-memory cache of comments indexed by postId.
 *
 * The container feeds the cache from httpResource values and the
 * create/update/delete handlers read from it to keep the UI in sync
 * without a full refetch. Persistence is intentionally omitted:
 * json-server keeps the source of truth.
 *
 * IMPORTANT: `observe` is reference-stable. It only writes a new array
 * (and a new Map) when the incoming comments differ in id or body from
 * what we already have. This keeps downstream computed/effect graphs
 * (e.g. `items()` in CommentsSectionComponent) from re-firing on
 * every refetch when the data is unchanged, which was causing an
 * infinite change-detection loop on post detail load.
 *
 * Mutations (prepend / replace / remove) also go through `observe`
 * so the same idempotence rules apply: if a refetch lands with the
 * same set after a local mutation, the cache stays put.
 *
 * Output is always sorted by `createdAt` descending (most recent
 * first).
 */
@Injectable({ providedIn: 'root' })
export class CommentsStore {
  private readonly _byPost = signal<ReadonlyMap<string, readonly Comment[]>>(new Map());

  /** Readonly view of the entire cache, keyed by postId. */
  readonly byPost = this._byPost.asReadonly();

  /** Comments for a single postId as a reactive computed signal. */
  forPost(postId: () => string) {
    return computed(() => this._byPost().get(postId()) ?? EMPTY);
  }

  observe(postId: string, comments: readonly Comment[]): void {
    const sorted = sortByCreatedDesc(comments);
    const existing = this._byPost().get(postId);
    if (existing && sameComments(existing, sorted)) {
      return; // No-op: identical content keeps the existing reference.
    }
    const next = new Map(this._byPost());
    next.set(postId, sorted);
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
    if (!this._byPost().has(postId)) {
      return;
    }
    const next = new Map(this._byPost());
    next.delete(postId);
    this._byPost.set(next);
  }
}

const EMPTY: readonly Comment[] = Object.freeze([]) as readonly Comment[];

/**
 * Sort comments by `createdAt` descending — most recent first.
 * Comments without a parseable timestamp keep their relative order.
 */
function sortByCreatedDesc(comments: readonly Comment[]): readonly Comment[] {
  const copy = [...comments];
  copy.sort((a, b) => {
    const ta = Date.parse(a.createdAt);
    const tb = Date.parse(b.createdAt);
    // Newer first.
    return tb - ta;
  });
  return copy;
}

/**
 * Structural equality on (id, body, userId, postId). Used to decide
 * whether a new incoming list of comments actually changes anything
 * for the cache. Order-sensitive: callers must pre-sort.
 */
function sameComments(a: readonly Comment[], b: readonly Comment[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.id !== y.id || x.body !== y.body || x.userId !== y.userId || x.postId !== y.postId) {
      return false;
    }
  }
  return true;
}
