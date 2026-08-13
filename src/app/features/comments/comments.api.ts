import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

import { API_BASE_URL } from '../../core/http/api-base-url.token';
import { toId } from '../../core/lib/ids';
import type { Comment, CommentPatch, NewComment } from './models/comment.model';

/**
 * CommentsApi talks to the `/comments` collection of the mock backend.
 *
 * listByPost returns an Observable for the httpResource integration.
 * Mutating endpoints (create/update/delete) return Promises.
 */
@Injectable({ providedIn: 'root' })
export class CommentsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /**
   * Build the URL + params pair used by the httpResource.
   */
  listByPostRequest(postId: () => string): { url: string; params: HttpParams } {
    return {
      url: `${this.baseUrl}/comments`,
      params: new HttpParams().set('postId', toId(postId())),
    };
  }

  listByPostOnce(postId: string): Promise<Comment[]> {
    return firstValueFrom(this.listByPost$(postId));
  }

  listByPost$(postId: string): Observable<Comment[]> {
    const params = new HttpParams().set('postId', toId(postId));
    return this.http.get<Comment[]>(`${this.baseUrl}/comments`, { params });
  }

  getById(id: string): Promise<Comment> {
    return firstValueFrom(this.http.get<Comment>(`${this.baseUrl}/comments/${toId(id)}`));
  }

  create(payload: NewComment): Promise<Comment> {
    return firstValueFrom(this.http.post<Comment>(`${this.baseUrl}/comments`, payload));
  }

  update(id: string, patch: CommentPatch): Promise<Comment> {
    return firstValueFrom(this.http.patch<Comment>(`${this.baseUrl}/comments/${toId(id)}`, patch));
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/comments/${toId(id)}`));
  }
}
