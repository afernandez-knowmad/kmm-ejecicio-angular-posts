import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../../core/http/api-base-url.token';
import { toId } from '../../core/lib/ids';
import type { PostListQuery, ServerPage } from './models/post-filters.model';
import type { NewPost, Post, PostPatch } from './models/post.model';

/**
 * HttpParams helper for the posts list endpoint.
 *
 * json-server v1-beta paginates whenever `_page` and `_per_page` are
 * provided. It returns a wrapper shaped like `{ first, prev, next,
 * last, pages, items, data }`, where `data` holds the current page and
 * `items` is the total number of records matching the filter.
 *
 * - `q`            : free-text search over title and body (json-server
 *                    full-text filter; works against the seed data).
 * - `userId`       : exact match on `Post.userId`.
 * - `tags_like`    : array-contains filter. json-server v1-beta ignores
 *                    this for paginated requests (known beta quirk),
 *                    so the tag filter is effectively a no-op until we
 *                    either migrate to a custom route or filter
 *                    client-side after fetching all matching posts.
 */
function buildListParams(query: PostListQuery): HttpParams {
  let params = new HttpParams()
    .set('_page', String(query.page))
    .set('_per_page', String(query.pageSize));

  const q = query.q?.trim();
  if (q) {
    params = params.set('q', q);
  }
  if (query.userId) {
    params = params.set('userId', toId(query.userId));
  }
  if (query.tag) {
    params = params.set('tags_like', query.tag);
  }
  return params;
}

/**
 * PostsApi talks to the `/posts` collection of the mock backend.
 *
 * - `listRequest` returns `{ url, params }` for an httpResource. The
 *   backend returns a `ServerPage<Post>` wrapper which the page then
 *   flattens for rendering.
 * - The other endpoints are imperative and return Promises, since
 *   mutations are not reactive.
 */
@Injectable({ providedIn: 'root' })
export class PostsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /**
   * Build the URL + params pair used by the list httpResource.
   */
  listRequest(query: () => PostListQuery): { url: string; params: HttpParams } {
    return {
      url: `${this.baseUrl}/posts`,
      params: buildListParams(query()),
    };
  }

  /**
   * Imperative single-shot fetch of the list. Useful for prefetch on
   * hover or for one-off consumers that do not need reactivity.
   */
  listOnce(query: PostListQuery): Promise<ServerPage<Post>> {
    return firstValueFrom(this.listObservable(query));
  }

  /**
   * Observable variant of `list`; lets the caller decide between
   * subscribe / firstValueFrom. The backend handles pagination.
   */
  listObservable(query: PostListQuery): Observable<ServerPage<Post>> {
    const params = buildListParams(query);
    return this.http.get<ServerPage<Post>>(`${this.baseUrl}/posts`, { params });
  }

  getById(id: string): Promise<Post> {
    return firstValueFrom(this.http.get<Post>(`${this.baseUrl}/posts/${toId(id)}`));
  }

  create(payload: NewPost): Promise<Post> {
    return firstValueFrom(this.http.post<Post>(`${this.baseUrl}/posts`, payload));
  }

  update(id: string, patch: PostPatch): Promise<Post> {
    return firstValueFrom(this.http.patch<Post>(`${this.baseUrl}/posts/${toId(id)}`, patch));
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/posts/${toId(id)}`));
  }
}
