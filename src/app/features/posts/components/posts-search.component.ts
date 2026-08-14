import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { PostsQueryState } from '../posts.query-state';

const SEARCH_DEBOUNCE_MS = 250;

/**
 * Debounced text search input. Writes through `PostsQueryState` so
 * the URL stays in sync.
 *
 * The input is fully controlled by `queryState.q()`. The previous
 * implementation built a signal model via the experimental
 * `@angular/forms/signals` `form()` API and reconciled it with
 * `PostsQueryState` through two `effect`s; that loop occasionally
 * reset the input back to the previous query value while the user
 * was still typing. Driving the input directly with `[value]` and
 * `(input)` removes the reconciliation entirely.
 */
@Component({
  selector: 'app-posts-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, IconComponent],
  template: `
    <label class="relative flex w-full items-center">
      <app-icon
        name="search"
        [size]="16"
        class="pointer-events-none absolute left-3 text-slate-400"
      />
      <input
        type="search"
        class="w-full rounded-full bg-slate-100 py-1.5 pl-9 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        [value]="queryState.q()"
        (input)="onInput($event)"
        [attr.placeholder]="'posts.filters.searchPlaceholder' | transloco"
        data-testid="posts-search-input"
      />
    </label>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
    `,
  ],
})
export class PostsSearchComponent {
  protected readonly queryState = inject(PostsQueryState);
  private readonly destroyRef = inject(DestroyRef);

  private debounceId: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearDebounce());
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.clearDebounce();
    this.debounceId = setTimeout(() => {
      const trimmed = value.trim() || undefined;
      if (trimmed !== this.queryState.query().q) {
        this.queryState.setQuery({ q: trimmed });
      }
    }, SEARCH_DEBOUNCE_MS);
  }

  private clearDebounce(): void {
    if (this.debounceId !== undefined) {
      clearTimeout(this.debounceId);
      this.debounceId = undefined;
    }
  }
}
