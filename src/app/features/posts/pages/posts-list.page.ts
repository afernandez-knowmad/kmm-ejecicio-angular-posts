import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
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

  protected readonly postsResource = httpResource<ServerPage<Post>>(() =>
    this.api.listRequest(() => this.queryState.query()),
  );

  protected readonly items = computed<readonly Post[]>(
    () => this.postsResource.value()?.data ?? [],
  );
  protected readonly total = computed<number>(() => this.postsResource.value()?.items ?? 0);
  protected readonly pageSize = computed<number>(() => this.queryState.pageSize());

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
