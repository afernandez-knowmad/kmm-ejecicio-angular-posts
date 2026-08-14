import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

import { API_BASE_URL } from '@core/http/api-base-url.token';
import type { User } from './models/user.model';

/**
 * AuthApi talks to the mock backend (`/users` collection).
 *
 * The mock backend has no `/auth/login` endpoint, so login is modelled
 * as a name+password lookup against `/users`. This is good enough for
 * the practice and keeps the service surface small.
 */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /**
   * Look up users whose `name` equals the given value. Returns at most
   * one record under normal seed data.
   */
  findByName(name: string): Observable<User[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<User[]>(`${this.baseUrl}/users`, { params });
  }

  /**
   * Promise-friendly wrapper used by `AuthStore.login`.
   */
  findByNameOnce(name: string): Promise<User[]> {
    return firstValueFrom(this.findByName(name));
  }
}
