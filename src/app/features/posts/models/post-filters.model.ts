import type { Post } from './post.model';

/**
 * Query parameters accepted by the posts list endpoint.
 *
 * Maps to json-server query string params. Keeping this as a single
 * interface makes it trivial to sync the value with router query params
 * (a later feature).
 */
export interface PostListQuery {
  /** Free-text search applied to title and body. */
  readonly q?: string;
  /** Filter by author id (matches `Post.userId`). */
  readonly userId?: string;
  /** Filter by a single tag (matches `Post.tags`). */
  readonly tag?: string;
  /** 1-based page index. */
  readonly page: number;
  /** Page size. */
  readonly pageSize: number;
}

/**
 * Default values used when no query is provided (e.g. on first navigation
 * to the list page).
 */
export const DEFAULT_POST_LIST_QUERY: PostListQuery = Object.freeze({
  q: '',
  userId: undefined,
  tag: undefined,
  page: 1,
  pageSize: 10,
});

/**
 * Generic paginated response. We model this in a shared place even if the
 * only consumer right now is `Post`, because comments will need it too.
 */
export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/**
 * Convenience alias for a page of posts.
 */
export type PostPage = Page<Post>;
