import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { PostListItemComponent } from '../components/post-list-item.component';
import { PostsAuthorFilterComponent } from '../components/posts-author-filter.component';
import { PostsPaginationComponent } from '../components/posts-pagination.component';
import { PostsSearchComponent } from '../components/posts-search.component';
import { PostsTagFilterComponent } from '../components/posts-tag-filter.component';
import { PostsApi } from '../posts.api';
import { PostsListCache } from '../posts-list-cache';
import { PostsQueryState } from '../posts.query-state';
import type { Post } from '../models/post.model';

/**
 * Posts list page.
 *
 * Subscribes to PostsQueryState for filters and pagination, and uses
 * `httpResource` to fetch the matching posts. Renders explicit
 * loading / empty / error states.
 *
 * Author lookup and tag chips will arrive in later commits; for now
 * each row shows just title + body excerpt and the total count comes
 * from the items length (the real total is a follow-up).
 */
@Component({
  selector: 'app-posts-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    PostListItemComponent,
    PostsSearchComponent,
    PostsAuthorFilterComponent,
    PostsTagFilterComponent,
    PostsPaginationComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  templateUrl: './posts-list.page.html',
  styleUrl: './posts-list.page.css',
})
export class PostsListPage {
  private readonly api = inject(PostsApi);
  private readonly cache = inject(PostsListCache);
  protected readonly queryState = inject(PostsQueryState);

  constructor() {
    // Feed the cache so the tag filter can compute its option set.
    effect(() => {
      const items = this.postsResource.value();
      if (items && items.length > 0) {
        this.cache.observe(items);
      }
    });
  }

  protected readonly postsResource = httpResource<Post[]>(() =>
    this.api.listRequest(() => this.queryState.query()),
  );

  protected readonly items = computed<Post[]>(() => this.postsResource.value() ?? []);
  protected readonly total = computed<number>(() => this.items().length);
}
