import type { Post } from './post.model';

export interface PostListQuery {
  readonly q?: string;
  readonly userId?: string;
  readonly tag?: string;
  readonly page: number;
  readonly pageSize: number;
}

export const DEFAULT_POST_LIST_QUERY: PostListQuery = Object.freeze({
  q: '',
  userId: undefined,
  tag: undefined,
  page: 1,
  pageSize: 4,
});

// Wrapper de json-server v1-beta: `data` es la página actual e
// `items` el total que matchea el filtro.
export interface ServerPage<T> {
  readonly first: number;
  readonly prev: number | null;
  readonly next: number | null;
  readonly last: number;
  readonly pages: number;
  readonly items: number;
  readonly data: readonly T[];
}

export type PostPage = ServerPage<Post>;
