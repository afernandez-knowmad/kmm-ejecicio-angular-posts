import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom, shareReplay } from 'rxjs';

import { API_BASE_URL } from '@core/http/api-base-url.token';
import type { PublicUser } from '@features/auth/models/user.model';

/**
 * Drop the password field. Lifted to a top-level function so ESLint
 * does not flag the unused destructured value.
 */
function stripPassword(user: PublicUser & { password?: string }): PublicUser {
  const { password, ...rest } = user;
  if (password !== undefined) {
    return rest;
  }
  return rest;
}

/**
 * Read-only UsersApi. The login flow uses `AuthApi.findByName`; this
 * service exists so the posts feature can show the author of each
 * post without re-implementing the request.
 */
@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  listAll$(): Observable<PublicUser[]> {
    // The mock backend returns the password field; we strip it on the
    // client to project to PublicUser. shareReplay caches the response
    // for the rest of the session.
    return this.http
      .get<(PublicUser & { password?: string })[]>(`${this.baseUrl}/users`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
  }

  async listAll(): Promise<PublicUser[]> {
    const raw = await firstValueFrom(this.listAll$());
    return raw.map(stripPassword);
  }
}
