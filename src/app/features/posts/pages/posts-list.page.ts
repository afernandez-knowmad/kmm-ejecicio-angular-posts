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
    // Lectura pura del tick para que el recurso se suscriba a las
    // invalidaciones disparadas por `bumpRefresh()`.
    this.queryState.refreshTick();
    return this.api.listRequest(() => this.queryState.query());
  });

  protected readonly items = computed<readonly Post[]>(
    () => this.postsResource.value()?.data ?? [],
  );
  protected readonly total = computed<number>(() => this.postsResource.value()?.items ?? 0);
  protected readonly pageSize = computed<number>(() => this.queryState.pageSize());

  protected readonly hasActiveFilters = this.queryState.hasActiveFilters;

  protected clearFilters(): void {
    this.queryState.resetFilters();
  }

  protected readonly rangeStart = computed<number>(() => {
    if (this.total() === 0) {
      return 0;
    }
    return (this.queryState.page() - 1) * this.pageSize() + 1;
  });

  // `items().length` en vez de `pageSize()` para reportar bien la
  // última página, que suele traer un slice parcial.
  protected readonly rangeEnd = computed<number>(() => {
    const start = this.rangeStart();
    return start === 0 ? 0 : start + this.items().length - 1;
  });

  protected readonly countKey = computed<'posts.list.count' | 'posts.list.countEmpty'>(() =>
    this.total() === 0 ? 'posts.list.countEmpty' : 'posts.list.count',
  );

  protected readonly countParams = computed<Record<string, number>>(() => {
    if (this.total() === 0) {
      return {} as Record<string, number>;
    }
    return {
      start: this.rangeStart(),
      end: this.rangeEnd(),
      total: this.total(),
    };
  });

  // Tags derivados SOLO de la página actual: sin acumulación. La
  // versión previa crecía sin tope en cada resolución del recurso
  // y congelaba la página.
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
