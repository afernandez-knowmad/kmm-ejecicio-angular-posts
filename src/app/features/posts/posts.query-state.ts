import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DEFAULT_POST_LIST_QUERY, type PostListQuery } from './models/post-filters.model';

// Solo se leen las claves que encajan con el modelo. Las desconocidas
// se dejan en la URL para no pisar a otros consumers.
function readQueryFromParams(params: { get(name: string): string | null }): PostListQuery {
  const q = (params.get('q') ?? '').trim();
  const userId = params.get('userId')?.trim() || undefined;
  const tag = params.get('tag')?.trim() || undefined;
  const pageRaw = params.get('page');
  const pageSizeRaw = params.get('pageSize');
  const page = Number.parseInt(pageRaw ?? '', 10);
  const pageSize = Number.parseInt(pageSizeRaw ?? '', 10);
  return {
    q: q || undefined,
    userId,
    tag,
    page: Number.isFinite(page) && page > 0 ? page : DEFAULT_POST_LIST_QUERY.page,
    pageSize:
      Number.isFinite(pageSize) && pageSize > 0 ? pageSize : DEFAULT_POST_LIST_QUERY.pageSize,
  };
}

function writeQueryToParams(query: PostListQuery): Record<string, string | null> {
  return {
    q: query.q?.trim() || null,
    userId: query.userId || null,
    tag: query.tag || null,
    page: query.page === DEFAULT_POST_LIST_QUERY.page ? null : String(query.page),
    pageSize: query.pageSize === DEFAULT_POST_LIST_QUERY.pageSize ? null : String(query.pageSize),
  };
}

@Injectable({ providedIn: 'root' })
export class PostsQueryState {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly _query = signal<PostListQuery>({ ...DEFAULT_POST_LIST_QUERY });

  // Lo suben los flujos de mutación (create/update/delete). La página
  // de listado lo lee dentro de la request factory del httpResource,
  // así que bumpearlo fuerza un reload aunque la URL no cambie.
  private readonly _refreshTick = signal(0);

  readonly query = this._query.asReadonly();
  readonly refreshTick = this._refreshTick.asReadonly();

  readonly q = computed(() => this._query().q ?? '');
  readonly userId = computed(() => this._query().userId);
  readonly tag = computed(() => this._query().tag);
  readonly page = computed(() => this._query().page);
  readonly pageSize = computed(() => this._query().pageSize);

  readonly hasActiveFilters = computed<boolean>(() => {
    const query = this._query();
    return Boolean(query.q?.trim()) || Boolean(query.userId) || Boolean(query.tag);
  });

  constructor() {
    // replaceUrl para no apilar entradas de history cuando los filtros
    // cambian rápido (p.ej. tecleando en el buscador).
    effect(() => {
      const params = writeQueryToParams(this._query());
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: params,
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    });
  }

  // Resetea a página 1 cuando cambia un filtro, para que el usuario
  // no caiga en una página vacía tras filtrar.
  setQuery(patch: Partial<PostListQuery>): void {
    const current = this._query();
    const next: PostListQuery = { ...current, ...patch };
    const filterChanged =
      (patch.q !== undefined && patch.q !== current.q) ||
      (patch.userId !== undefined && patch.userId !== current.userId) ||
      (patch.tag !== undefined && patch.tag !== current.tag);
    if (filterChanged && next.page !== 1) {
      this._query.set({ ...next, page: 1 });
      return;
    }
    this._query.set(next);
  }

  syncFromUrl(): void {
    this._query.set(readQueryFromParams(this.route.snapshot.queryParamMap));
  }

  resetFilters(): void {
    const current = this._query();
    this._query.set({
      ...current,
      q: DEFAULT_POST_LIST_QUERY.q,
      userId: DEFAULT_POST_LIST_QUERY.userId,
      tag: DEFAULT_POST_LIST_QUERY.tag,
      page: DEFAULT_POST_LIST_QUERY.page,
    });
  }

  bumpRefresh(): void {
    this._refreshTick.update((n) => n + 1);
  }
}
