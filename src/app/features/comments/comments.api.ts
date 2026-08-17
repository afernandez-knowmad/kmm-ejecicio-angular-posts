import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

import { API_BASE_URL } from '@core/http/api-base-url.token';
import { toBackendId, toId } from '@core/lib/ids';
import type { ServerPage } from '@features/posts/models/post-filters.model';
import type { Comment, CommentPatch, NewComment } from './models/comment.model';

export const COMMENTS_PAGE_SIZE = 2;

@Injectable({ providedIn: 'root' })
export class CommentsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  listByPostRequest(postId: () => string): { url: string; params: HttpParams } {
    return {
      url: `${this.baseUrl}/comments`,
      params: buildListParams(postId(), 1),
    };
  }

  listByPostOnce(postId: string, page: number): Promise<ServerPage<Comment>> {
    return firstValueFrom(this.listByPost$(postId, page));
  }

  listByPost$(postId: string, page: number): Observable<ServerPage<Comment>> {
    const params = buildListParams(postId, page);
    return this.http.get<ServerPage<Comment>>(`${this.baseUrl}/comments`, { params });
  }

  getById(id: string): Promise<Comment> {
    return firstValueFrom(this.http.get<Comment>(`${this.baseUrl}/comments/${toId(id)}`));
  }

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

// `_order` viene roto en json-server v1-beta (`_sort=createdAt&_order=desc`
// devuelve 0 resultados). El prefijo `-campo` funciona en v1-beta y v0.x.
function buildListParams(postId: string, page: number): HttpParams {
  return new HttpParams()
    .set('postId', toBackendId(postId))
    .set('_page', String(page))
    .set('_per_page', String(COMMENTS_PAGE_SIZE))
    .set('_sort', '-createdAt');
}
