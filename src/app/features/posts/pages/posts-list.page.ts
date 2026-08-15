import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { EmptyStateComponent } from '@shared/ui/empty-state.component';
import { ErrorStateComponent } from '@shared/ui/error-state.component';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { LoadingStateComponent } from '@shared/ui/loading-state.component';
import { PostListItemComponent } from '../components/post-list-item.component';
import { PostsAuthorFilterComponent } from '../components/posts-author-filter.component';
import { PostsPaginationComponent } from '../components/posts-pagination.component';
import { PostsTagFilterComponent } from '../components/posts-tag-filter.component';
import type { ServerPage } from '../models/post-filters.model';
import { PostsApi } from '../posts.api';
import { PostsQueryState } from '../posts.query-state';
import type { Post } from '../models/post.model';

/**
 * Posts list page.
 *
 * Subscribes to PostsQueryState for filters and pagination, and uses
 * `httpResource` to fetch the matching posts. json-server v1-beta
 * returns a `ServerPage<Post>` wrapper when `_page` / `_per_page` are
 * present; we read `data` for the current page and `items` for the
 * total number of records matching the filter.
 *
 * The page also projects the search box and the "new post" button
 * into the app shell header via the `appHeaderSearch` and
 * `appHeaderActions` content slots — see `app.html`.
 *
 * Tag options are derived from the CURRENT page of posts only — no
 * accumulation, no in-memory cache. Re-enable a proper tag index in
 * a follow-up once it is bounded.
 */
@Component({
  selector: 'app-posts-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    RouterLink,
    IconComponent,
    PostListItemComponent,
    PostsAuthorFilterComponent,
    PostsTagFilterComponent,
    PostsPaginationComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  templateUrl: './posts-list.page.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class PostsListPage {
  private readonly api = inject(PostsApi);
  protected readonly queryState = inject(PostsQueryState);

  protected readonly postsResource = httpResource<ServerPage<Post>>(() => {
    // Reading `refreshTick()` inside the request factory subscribes
    // the resource to mutation-triggered invalidations. Any call to
    // `queryState.bumpRefresh()` will refetch this endpoint, even if
    // the URL / query params themselves did not change. The
    // expression has no side effect on its own — it only registers
    // a reactive dependency for the resource.
    this.queryState.refreshTick();
    return this.api.listRequest(() => this.queryState.query());
  });

  protected readonly items = computed<readonly Post[]>(
    () => this.postsResource.value()?.data ?? [],
  );
  protected readonly total = computed<number>(() => this.postsResource.value()?.items ?? 0);
  protected readonly pageSize = computed<number>(() => this.queryState.pageSize());

  /**
   * True when any filter (search, author or tag) is currently set.
   * Drives the "Clear filters" button inside the empty state.
   */
  protected readonly hasActiveFilters = this.queryState.hasActiveFilters;

  /** Reset every user-driven filter and jump back to the first page. */
  protected clearFilters(): void {
    this.queryState.resetFilters();
  }

  /**
   * 1-based index of the first item of the current page.
   * Returns 0 when there are no results at all so the message can
   * be cleanly switched to a dedicated "no results" translation.
   */
  protected readonly rangeStart = computed<number>(() => {
    if (this.total() === 0) {
      return 0;
    }
    return (this.queryState.page() - 1) * this.pageSize() + 1;
  });

  /**
   * 1-based index of the last item of the current page (inclusive).
   * Uses `items().length` rather than `pageSize()` so the trailing
   * page, which often holds a partial slice, is reported correctly.
   */
  protected readonly rangeEnd = computed<number>(() => {
    const start = this.rangeStart();
    return start === 0 ? 0 : start + this.items().length - 1;
  });

  /**
   * Translation key for the result count badge. Picks a dedicated
   * "empty" key when the filter returns nothing so we never end up
   * showing "Showing 0-0 of 0 results".
   */
  protected readonly countKey = computed<'posts.list.count' | 'posts.list.countEmpty'>(() =>
    this.total() === 0 ? 'posts.list.countEmpty' : 'posts.list.count',
  );

  /**
   * Params bag fed to the `transloco` pipe. The empty state carries
   * no params; the populated state carries the range plus the total.
   */
  protected readonly countParams = computed<Record<string, number>>(() => {
    if (this.total() === 0) {
      // Cast: an empty literal can't satisfy `Record<string, number>`
      // by inference, but it's the value the pipe expects for keys
      // with no params.
      return {} as Record<string, number>;
    }
    return {
      start: this.rangeStart(),
      end: this.rangeEnd(),
      total: this.total(),
    };
  });

  /**
   * Tag options shown by the chip filter.
   *
   * Derived from the CURRENT page of posts only — no accumulation,
   * no in-memory cache. The previous implementation grew a signal-
   * backed array unboundedly on every resource resolution, which
   * froze the page after a handful of interactions. Re-enable
   * caching in a follow-up once it is properly bounded.
   */
  protected readonly tags = computed<readonly string[]>(() => {
    const set = new Set<string>();
    for (const p of this.items()) {
      for (const t of p.tags) {
        set.add(t);
      }
    }
    return Array.from(set).sort();
  });
}
