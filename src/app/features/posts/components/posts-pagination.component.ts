import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { IconComponent } from '../../../shared/ui/icon/icon.component';
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
  imports: [TranslocoModule, IconComponent],
  host: { class: 'block' },
  template: `
    <nav
      class="mt-6 flex items-center justify-between gap-4"
      aria-label="pagination"
      data-testid="posts-pagination"
    >
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        [disabled]="!canPrev()"
        (click)="prev()"
        data-testid="posts-pagination-prev"
      >
        <app-icon name="arrow-left" [size]="16" />
        <span>{{ 'posts.pagination.prev' | transloco }}</span>
      </button>

      <ul class="flex items-center gap-1" data-testid="posts-pagination-pages">
        @for (slot of pages(); track trackSlot($index, slot)) {
          @if (slot === '…') {
            <li
              class="px-2 text-sm text-slate-400"
              aria-hidden="true"
              data-testid="posts-pagination-ellipsis"
            >
              …
            </li>
          } @else {
            <li>
              <button
                type="button"
                class="inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-medium transition-colors"
                [class.bg-brand-600]="slot === page()"
                [class.text-white]="slot === page()"
                [class.text-slate-600]="slot !== page()"
                [class.hover:bg-slate-100]="slot !== page()"
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
        class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        [disabled]="!canNext()"
        (click)="next()"
        data-testid="posts-pagination-next"
      >
        <span>{{ 'posts.pagination.next' | transloco }}</span>
        <app-icon name="arrow-right" [size]="16" />
      </button>
    </nav>
  `,
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
