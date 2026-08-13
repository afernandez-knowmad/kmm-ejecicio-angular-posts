import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../../core/http/api-base-url.token';
import { toId } from '../../core/lib/ids';
import type { Page, PostListQuery } from './models/post-filters.model';
import type { NewPost, Post, PostPatch } from './models/post.model';

/**
 * HttpParams helper. json-server v1-beta.15 (used by this project)
 * returns the full filtered array on a plain GET /posts. The new
 * beta also supports a paginated wrapper, but it ignores _page and
 * _limit on certain routes and ends up returning { data: [] }, so
 * we fetch the full list and paginate in the client.
 *
 * q, userId and tags_like are sent as-is because they work
 * correctly against the seed data.
 */
function buildListParams(query: PostListQuery): HttpParams {
  let params = new HttpParams();

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
 * Slice the array returned by the backend into the requested page.
 * Page numbers are 1-based.
 */
function slicePage<T>(items: readonly T[], query: PostListQuery): Page<T> {
  const total = items.length;
  const start = (query.page - 1) * query.pageSize;
  return {
    items: items.slice(start, start + query.pageSize),
    total,
    page: query.page,
    pageSize: query.pageSize,
  };
}

/**
 * PostsApi talks to the `/posts` collection of the mock backend.
 *
 * - listRequest returns { url, params } for an httpResource; the
 *   backend returns the full filtered array and pagination is
 *   applied client-side.
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
  listOnce(query: PostListQuery): Promise<Page<Post>> {
    return firstValueFrom(this.listObservable(query));
  }

  /**
   * Observable variant of `list`; lets the caller decide between
   * subscribe / firstValueFrom. Pagination happens locally after
   * the filtered array is returned.
   */
  listObservable(query: PostListQuery): Observable<Page<Post>> {
    const params = buildListParams(query);
    return new Observable<Page<Post>>((subscriber) => {
      const sub = this.http.get<Post[]>(`${this.baseUrl}/posts`, { params }).subscribe({
        next: (items) => {
          subscriber.next(slicePage(items ?? [], query));
          subscriber.complete();
        },
        error: (err) => subscriber.error(err),
      });
      return () => sub.unsubscribe();
    });
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
