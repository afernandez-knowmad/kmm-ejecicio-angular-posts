import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { PostListItemComponent } from '../components/post-list-item.component';
import { PostsSearchComponent } from '../components/posts-search.component';
import { PostsApi } from '../posts.api';
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
  imports: [TranslocoModule, PostListItemComponent, PostsSearchComponent],
  templateUrl: './posts-list.page.html',
  styleUrl: './posts-list.page.css',
})
export class PostsListPage {
  private readonly api = inject(PostsApi);
  protected readonly queryState = inject(PostsQueryState);

  protected readonly postsResource = httpResource<Post[]>(() =>
    this.api.listRequest(() => this.queryState.query()),
  );

  protected readonly items = computed<Post[]>(() => this.postsResource.value() ?? []);
  protected readonly total = computed<number>(() => this.items().length);
}
