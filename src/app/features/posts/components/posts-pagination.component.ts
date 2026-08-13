import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { PostsQueryState } from '../posts.query-state';

/**
 * Single token used to render ellipsis in the page list.
 *
 * Page slots are computed as a flat list of either `number` (a real
 * page index) or the string `'…'` to keep the template branching-free.
 */
type PageSlot = number | '…';

/**
 * Build the compact page list shown in the pager.
 *
 * - Always includes the first and last page.
 * - Keeps the current page and its neighbours within a window so the
 *   pager stays short even for very long result sets.
 * - Inserts ellipsis on either side when the window does not touch
 *   the boundary.
 *
 * Example (current=6, last=10, window=1) → [1, …, 5, 6, 7, …, 10]
 */
function buildPageSlots(current: number, last: number, window = 1): PageSlot[] {
  if (last <= 1) {
    return [];
  }

  const slots = new Set<number>();
  const push = (n: number) => {
    if (n >= 1 && n <= last) {
      slots.add(n);
    }
  };

  push(1);
  push(last);
  for (let p = current - window; p <= current + window; p += 1) {
    push(p);
  }

  const sorted = Array.from(slots).sort((a, b) => a - b);
  const result: PageSlot[] = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const value = sorted[i];
    const previous = i > 0 ? sorted[i - 1] : null;
    if (previous !== null && value - previous > 1) {
      result.push('…');
    }
    result.push(value);
  }
  return result;
}

/**
 * Pagination controls wired to PostsQueryState.
 *
 * The total number of items matching the current filter is passed in
 * by the parent page (it comes from the json-server paginated
 * wrapper). From there we derive the last page and render a numbered
 * pager with prev/next and ellipsis for long result sets.
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

      <ul class="posts-pagination__pages" data-testid="posts-pagination-pages">
        @for (slot of pages(); track trackSlot($index, slot)) {
          @if (slot === '…') {
            <li
              class="posts-pagination__ellipsis"
              aria-hidden="true"
              data-testid="posts-pagination-ellipsis"
            >
              …
            </li>
          } @else {
            <li>
              <button
                type="button"
                class="posts-pagination__page"
                [class.is-active]="slot === page()"
                [attr.aria-current]="slot === page() ? 'page' : null"
                [attr.aria-label]="'posts.pagination.gotoPage' | transloco: { page: slot }"
                (click)="goto(slot)"
                [attr.data-testid]="'posts-pagination-page-' + slot"
              >
                {{ slot }}
              </button>
            </li>
          }
        }
      </ul>

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
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      .posts-pagination__pages {
        display: flex;
        list-style: none;
        padding: 0;
        margin: 0;
        gap: 0.25rem;
      }
      .posts-pagination__btn,
      .posts-pagination__page {
        padding: 0.375rem 0.75rem;
        border-radius: 0.375rem;
        border: 1px solid rgba(0, 0, 0, 0.2);
        background: transparent;
        cursor: pointer;
        font: inherit;
        line-height: 1;
      }
      .posts-pagination__btn[disabled],
      .posts-pagination__page[disabled] {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .posts-pagination__page.is-active {
        background: #2563eb;
        color: #fff;
        border-color: #2563eb;
      }
      .posts-pagination__ellipsis {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.375rem 0.5rem;
        font-size: 0.875rem;
      }
    `,
  ],
})
export class PostsPaginationComponent {
  private readonly queryState = inject(PostsQueryState);

  /** Total number of items matching the current filter (across pages). */
  readonly total = input<number>(0);

  protected readonly page = computed(() => this.queryState.page());
  protected readonly pageSize = computed(() => this.queryState.pageSize());

  /** Total pages derived from `total / pageSize`. Always at least 1. */
  protected readonly lastPage = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );

  protected readonly canPrev = computed(() => this.page() > 1);
  protected readonly canNext = computed(() => this.page() < this.lastPage());

  /** Compact list of pages (plus ellipsis) actually rendered as buttons. */
  protected readonly pages = computed<PageSlot[]>(() =>
    buildPageSlots(this.page(), this.lastPage()),
  );

  protected trackSlot(index: number, slot: PageSlot): string {
    return slot === '…' ? `ellipsis-${index}` : `page-${slot}`;
  }

  protected prev(): void {
    if (this.canPrev()) {
      this.queryState.setQuery({ page: this.page() - 1 });
    }
  }

  protected next(): void {
    if (this.canNext()) {
      this.queryState.setQuery({ page: this.page() + 1 });
    }
  }

  protected goto(target: number): void {
    if (target < 1 || target > this.lastPage() || target === this.page()) {
      return;
    }
    this.queryState.setQuery({ page: target });
  }
}
