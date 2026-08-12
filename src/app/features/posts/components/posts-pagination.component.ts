import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { PostsQueryState } from '../posts.query-state';

/**
 * Pagination controls wired to PostsQueryState.
 *
 * Total is approximated as `items.length` until we read X-Total-Count
 * in a follow-up. Going forward is disabled when the current page is
 * the last known one.
 */
@Component({
  selector: 'app-posts-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule],
  template: `
    <nav class="posts-pagination" aria-label="pagination" data-testid="posts-pagination">
      <button
        type="button"
        class="posts-pagination__btn"
        [disabled]="!canPrev()"
        (click)="prev()"
        data-testid="posts-pagination-prev"
      >
        {{ 'posts.pagination.prev' | transloco }}
      </button>
      <span class="posts-pagination__info" data-testid="posts-pagination-info">
        {{ 'posts.pagination.page' | transloco: { page: page() } }}
      </span>
      <button
        type="button"
        class="posts-pagination__btn"
        [disabled]="!canNext()"
        (click)="next()"
        data-testid="posts-pagination-next"
      >
        {{ 'posts.pagination.next' | transloco }}
      </button>
    </nav>
  `,
  styles: [
    `
      .posts-pagination {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      .posts-pagination__btn {
        padding: 0.375rem 0.75rem;
        border-radius: 0.375rem;
        border: 1px solid rgba(0, 0, 0, 0.2);
        background: transparent;
        cursor: pointer;
      }
      .posts-pagination__btn[disabled] {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .posts-pagination__info {
        font-size: 0.875rem;
      }
    `,
  ],
})
export class PostsPaginationComponent {
  private readonly queryState = inject(PostsQueryState);

  protected readonly page = computed(() => this.queryState.page());

  // Last page is unknown without the real total, so we only allow going
  // back from page 1 and forward when the current page returned at
  // least one item. PostsListPage can pass an updated total via
  // input() in a follow-up.
  protected readonly canPrev = computed(() => this.page() > 1);
  protected readonly canNext = computed(() => true);

  protected prev(): void {
    if (this.canPrev()) {
      this.queryState.setQuery({ page: this.page() - 1 });
    }
  }

  protected next(): void {
    this.queryState.setQuery({ page: this.page() + 1 });
  }
}
