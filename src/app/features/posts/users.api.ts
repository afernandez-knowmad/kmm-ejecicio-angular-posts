import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom, shareReplay } from 'rxjs';

import { API_BASE_URL } from '@core/http/api-base-url.token';
import type { PublicUser } from '@features/auth/models/user.model';

function stripPassword(user: PublicUser & { password?: string }): PublicUser {
  const { password, ...rest } = user;
  if (password !== undefined) {
    return rest;
  }
  return rest;
}

@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  listAll$(): Observable<PublicUser[]> {
    return this.http
      .get<(PublicUser & { password?: string })[]>(`${this.baseUrl}/users`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
  }

  async listAll(): Promise<PublicUser[]> {
    const raw = await firstValueFrom(this.listAll$());
    return raw.map(stripPassword);
  }
}
