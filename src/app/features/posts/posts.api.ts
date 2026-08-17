import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '@core/http/api-base-url.token';
import { toBackendId, toId } from '@core/lib/ids';
import type { PostListQuery, ServerPage } from './models/post-filters.model';
import type { NewPost, Post, PostPatch } from './models/post.model';

// `_where` con `contains` porque el `q` de la beta es no-op en paginadas.
// `tags_like` lo ignora también en paginadas, así que hoy el filtro
// por tag es de facto un no-op.
function buildListParams(query: PostListQuery): HttpParams {
  let params = new HttpParams()
    .set('_page', String(query.page))
    .set('_per_page', String(query.pageSize));

  const q = query.q?.trim();
  if (q) {
    params = params.set(
      '_where',
      JSON.stringify({
        or: [{ title: { contains: q } }, { body: { contains: q } }],
      }),
    );
  }
  if (query.userId) {
    params = params.set('userId', toBackendId(query.userId));
  }
  if (query.tag) {
    params = params.set('tags_like', query.tag);
  }
  return params;
}

@Injectable({ providedIn: 'root' })
export class PostsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  listRequest(query: () => PostListQuery): { url: string; params: HttpParams } {
    return {
      url: `${this.baseUrl}/posts`,
      params: buildListParams(query()),
    };
  }

  listOnce(query: PostListQuery): Promise<ServerPage<Post>> {
    return firstValueFrom(this.listObservable(query));
  }

  listObservable(query: PostListQuery): Observable<ServerPage<Post>> {
    const params = buildListParams(query);
    return this.http.get<ServerPage<Post>>(`${this.baseUrl}/posts`, { params });
  }

  getById(id: string): Promise<Post> {
    return firstValueFrom(this.http.get<Post>(`${this.baseUrl}/posts/${toId(id)}`));
  }

  create(payload: NewPost): Promise<Post> {
    const body = { ...payload, userId: toBackendId(payload.userId) };
    return firstValueFrom(this.http.post<Post>(`${this.baseUrl}/posts`, body));
  }

  update(id: string, patch: PostPatch): Promise<Post> {
    return firstValueFrom(this.http.patch<Post>(`${this.baseUrl}/posts/${toId(id)}`, patch));
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/posts/${toId(id)}`));
  }
}
