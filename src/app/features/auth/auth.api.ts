import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

import { API_BASE_URL } from '@core/http/api-base-url.token';
import type { User } from './models/user.model';

/**
 * AuthApi habla con el backend mock (colección `/users`).
 *
 * No hay endpoint `/auth/login`, así que el login se modela como un
 * lookup por name+password contra `/users`. Suficiente para la
 * práctica y mantiene la superficie pequeña.
 */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  findByName(name: string): Observable<User[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<User[]>(`${this.baseUrl}/users`, { params });
  }

  findByNameOnce(name: string): Promise<User[]> {
    return firstValueFrom(this.findByName(name));
  }
}
