import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { DEFAULT_POST_LIST_QUERY, type PostListQuery } from './models/post-filters.model';

/**
 * Parse the URL query params into a PostListQuery.
 *
 * Only keys that match the model are read. Unknown keys are left
 * alone in the URL so we do not destroy other consumers.
 */
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

/**
 * Inverse of `readQueryFromParams`: build a queryParams object suitable
 * for `router.navigate`. Drops empty fields to keep the URL clean.
 */
function writeQueryToParams(query: PostListQuery): Record<string, string | null> {
  return {
    q: query.q?.trim() || null,
    userId: query.userId || null,
    tag: query.tag || null,
    page: query.page === DEFAULT_POST_LIST_QUERY.page ? null : String(query.page),
    pageSize: query.pageSize === DEFAULT_POST_LIST_QUERY.pageSize ? null : String(query.pageSize),
  };
}

/**
 * PostsQueryState is a single signal-backed view of the current
 * PostListQuery, kept in sync with the router query params.
 *
 * It is the single source of truth for filtering and pagination:
 *  - Filters/pagination update `query` via `setQuery(...)`.
 *  - `effect` mirrors the resulting query into the URL.
 *  - Reading from the URL (back/forward navigation) refreshes
 *    `query` via `syncFromUrl`.
 */
@Injectable({ providedIn: 'root' })
export class PostsQueryState {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly _query = signal<PostListQuery>({ ...DEFAULT_POST_LIST_QUERY });

  /**
   * Bumped by mutation flows (create / update / delete) so any
   * `httpResource` keyed on this state invalidates and refetches.
   * The list page reads this signal inside its request factory, so
   * bumping it forces a reload even when the URL / query params
   * themselves did not change.
   *
   * Starts at 0 so the initial fetch is unaffected.
   */
  private readonly _refreshTick = signal(0);

  /** Readonly view of the current query. */
  readonly query = this._query.asReadonly();

  /**
   * Readonly view of the refresh tick. Read inside httpResource
   * request factories to subscribe to invalidations triggered by
   * `bumpRefresh()`.
   */
  readonly refreshTick = this._refreshTick.asReadonly();

  /** Convenience computed: same data as `query()` but guaranteed reactive. */
  readonly q = computed(() => this._query().q ?? '');
  readonly userId = computed(() => this._query().userId);
  readonly tag = computed(() => this._query().tag);
  readonly page = computed(() => this._query().page);
  readonly pageSize = computed(() => this._query().pageSize);

  /**
   * True when any user-driven filter (search, author or tag) is set.
   * Used by the list page to surface a "Clear filters" affordance
   * inside the empty state.
   */
  readonly hasActiveFilters = computed<boolean>(() => {
    const query = this._query();
    return Boolean(query.q?.trim()) || Boolean(query.userId) || Boolean(query.tag);
  });

  constructor() {
    // Sync _query → URL. Using replaceUrl so we don't pile up history
    // entries when filters change rapidly (e.g. typing in a search
    // box).
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

  /**
   * Patch the current query. Resets to page 1 whenever text/author/tag
   * filters change so users do not land on an empty page after a
   * filter change.
   */
  setQuery(patch: Partial<PostListQuery>): void {
    const current = this._query();
    const next: PostListQuery = { ...current, ...patch };
    const filterChanged =
      (patch.q !== undefined && patch.q !== current.q) ||
      (patch.userId !== undefined && patch.userId !== current.userId) ||
      (patch.tag !== undefined && patch.tag !== current.tag);
    if (filterChanged && next.page !== 1) {
      // Readonly contract: rebuild the object instead of mutating.
      this._query.set({ ...next, page: 1 });
      return;
    }
    this._query.set(next);
  }

  /**
   * Re-read the query from the current URL. Call this from the page
   * when the user navigates back/forward.
   */
  syncFromUrl(): void {
    this._query.set(readQueryFromParams(this.route.snapshot.queryParamMap));
  }

  /**
   * Clear every user-driven filter (search, author, tag) and reset
   * pagination to the first page. Page size is left untouched so the
   * user keeps their preferred slice size.
   */
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

  /**
   * Invalidate every consumer that reads `refreshTick()` (notably the
   * list page's `httpResource`). Call this after any successful
   * mutation so the list reflects the new state on the next render.
   */
  bumpRefresh(): void {
    this._refreshTick.update((n) => n + 1);
  }
}
