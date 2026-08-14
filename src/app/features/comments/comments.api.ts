import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

import { API_BASE_URL } from '@core/http/api-base-url.token';
import { toBackendId, toId } from '@core/lib/ids';
import type { ServerPage } from '@features/posts/models/post-filters.model';
import type { Comment, CommentPatch, NewComment } from './models/comment.model';

/**
 * Page size used by the comments list pagination.
 *
 * Kept small so the initial `httpResource` resolution is fast and
 * the progressive scroll-into-view loading kicks in soon.
 */
export const COMMENTS_PAGE_SIZE = 2;

/**
 * CommentsApi talks to the `/comments` collection of the mock backend.
 *
 * `listByPostRequest` returns the params needed by the initial
 * `httpResource` for page 1. Subsequent pages are fetched imperatively
 * via `listByPostOnce(postId, page)` for the infinite-scroll sentinel.
 * Mutating endpoints (create/update/delete) return Promises.
 */
@Injectable({ providedIn: 'root' })
export class CommentsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /**
   * Build the URL + params pair used by the httpResource for the
   * first page.
   *
   * The query value is normalised via `toBackendId` so json-server's
   * type-strict filter matches the seed (numeric ids stored as
   * numbers) without breaking dynamically-created posts (whose ids
   * are alphanumeric strings).
   */
  listByPostRequest(postId: () => string): { url: string; params: HttpParams } {
    return {
      url: `${this.baseUrl}/comments`,
      params: buildListParams(postId(), 1),
    };
  }

  /**
   * Fetch a single page of comments for a post. Used by the
   * infinite-scroll sentinel to load more pages after the initial
   * `httpResource` has resolved.
   */
  listByPostOnce(postId: string, page: number): Promise<ServerPage<Comment>> {
    return firstValueFrom(this.listByPost$(postId, page));
  }

  /** Observable variant of `listByPostOnce`. */
  listByPost$(postId: string, page: number): Observable<ServerPage<Comment>> {
    const params = buildListParams(postId, page);
    return this.http.get<ServerPage<Comment>>(`${this.baseUrl}/comments`, { params });
  }

  getById(id: string): Promise<Comment> {
    return firstValueFrom(this.http.get<Comment>(`${this.baseUrl}/comments/${toId(id)}`));
  }

  /**
   * Create a comment.
   *
   * `postId` and `userId` are coerced via `toBackendId` so the
   * persisted row matches the type the rest of the collection uses
   * (number for seeded ids, string for auto-generated ones). Without
   * this, a comment posted against a seeded post (`postId: "1"` as
   * a string) would never re-appear in `GET /comments?postId=1`,
   * because json-server's query filter is type-strict.
   */
  create(payload: NewComment): Promise<Comment> {
    const body = {
      ...payload,
      postId: toBackendId(payload.postId),
      userId: toBackendId(payload.userId),
    };
    return firstValueFrom(this.http.post<Comment>(`${this.baseUrl}/comments`, body));
  }

  update(id: string, patch: CommentPatch): Promise<Comment> {
    return firstValueFrom(this.http.patch<Comment>(`${this.baseUrl}/comments/${toId(id)}`, patch));
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/comments/${toId(id)}`));
  }
}

/**
 * Build the HttpParams for a comments list request.
 *
 * `json-server` v1-beta paginates and returns a `ServerPage`
 * wrapper when `_page` and `_per_page` are both present. Without
 * both, it returns a flat array — which is why we always include
 * them, even for the first page.
 *
 * The descending sort uses the `-fieldName` prefix convention
 * because json-server v1-beta ships a broken `_order` parameter
 * (combining `_sort=createdAt&_order=desc` returns 0 items instead
 * of an inverted sort). The leading `-` works in both v1-beta and
 * the legacy v0.x line, so it is the safer choice here.
 *
 * With `-createdAt`, page 1 always returns the most recently
 * created comments. That is what the UI expects: a freshly-created
 * comment (via `prepend` then `reload()`) lands on the first page
 * and is guaranteed to appear at the top of the list without
 * requiring an extra "Cargar más" click. Without the sort, the
 * seed (insertion order) happens to be oldest-first.
 */
function buildListParams(postId: string, page: number): HttpParams {
  return new HttpParams()
    .set('postId', toBackendId(postId))
    .set('_page', String(page))
    .set('_per_page', String(COMMENTS_PAGE_SIZE))
    .set('_sort', '-createdAt');
}
