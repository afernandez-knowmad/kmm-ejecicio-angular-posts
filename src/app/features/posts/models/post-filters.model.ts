import type { Post } from './post.model';

/**
 * Query parameters accepted by the posts list endpoint.
 *
 * Maps to json-server v1-beta query string params. Keeping this as a
 * single interface makes it trivial to sync the value with router
 * query params.
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
 * Default values used when no query is provided (e.g. on first
 * navigation to the list page).
 */
export const DEFAULT_POST_LIST_QUERY: PostListQuery = Object.freeze({
  q: '',
  userId: undefined,
  tag: undefined,
  page: 1,
  pageSize: 4,
});

/**
 * Paginated wrapper returned by json-server v1-beta when `_page` and
 * `_per_page` are present in the query string.
 *
 * - `data`   : the slice of items for the requested page
 * - `items`  : total number of items matching the filter (across pages)
 * - `pages`  : total number of pages for the current page size
 * - `first`  : first page number (always 1)
 * - `last`   : last page number
 * - `prev`   : previous page number, or `null` on the first page
 * - `next`   : next page number, or `null` on the last page
 */
export interface ServerPage<T> {
  readonly first: number;
  readonly prev: number | null;
  readonly next: number | null;
  readonly last: number;
  readonly pages: number;
  /** Total number of items matching the filter. */
  readonly items: number;
  /** Items for the current page. */
  readonly data: readonly T[];
}

/**
 * Convenience alias for a page of posts.
 */
export type PostPage = ServerPage<Post>;
