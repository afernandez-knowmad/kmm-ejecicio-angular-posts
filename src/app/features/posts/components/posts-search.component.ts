import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  linkedSignal,
  untracked,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { TranslocoModule } from '@jsverse/transloco';

import { IconComponent } from '@shared/ui/icon/icon.component';
import { PostsQueryState } from '../posts.query-state';

const SEARCH_DEBOUNCE_MS = 250;

interface SearchModel {
  q: string;
}

/**
 * Debounced text search input backed by Signal Forms.
 *
 * The input is bound through `[formField]` and is the source of truth
 * while the user types. A single `effect` mirrors the form value into
 * `PostsQueryState` after a short debounce so the URL stays in sync.
 *
 * `linkedSignal` seeds the model from `queryState.q()` so external
 * changes (Clear filters, back/forward navigation) update the input,
 * but typing in the input does not re-trigger this seeding — that's
 * what previously caused the input to snap back mid-keystroke.
 *
 * The `untracked()` read of `queryState.query().q` inside the
 * debounce callback breaks the reactive dependency that would
 * otherwise fire on every URL sync.
 */
@Component({
  selector: 'app-posts-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, IconComponent, FormField],
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
        [formField]="form.q"
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

  /**
   * Mirrors `queryState.q()` into the form model.
   *
   * `linkedSignal` is configured with `source`/`computation`/`equal`
   * so that the inner signal only updates when `q` is **actually**
   * different. The default `Object.is` is not enough: the source
   * thunk returns a fresh `{ q }` object on every evaluation, so the
   * default equality would mark every re-evaluation as a change and
   * re-trigger the debounced effect, creating a render/write loop.
   *
   * With the `equal` below, when our own debounced `setQuery` causes
   * the source to re-emit the same value we already have, the model
   * stays put and the effect does not re-fire. External changes
   * (Clear filters, back/forward navigation) still flow through.
   */
  protected readonly model = linkedSignal<SearchModel, SearchModel>({
    source: () => ({ q: this.queryState.q() }),
    computation: (source) => source,
    equal: (a, b) => a.q === b.q,
  });
  protected readonly form = form(this.model);

  private debounceId: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearDebounce());

    // Single effect: form value → queryState (debounced).
    effect(() => {
      const raw = this.form.q().value();
      this.clearDebounce();
      this.debounceId = setTimeout(() => {
        const trimmed = raw.trim() || undefined;
        untracked(() => {
          if (trimmed !== this.queryState.query().q) {
            this.queryState.setQuery({ q: trimmed });
          }
        });
      }, SEARCH_DEBOUNCE_MS);
    });
  }

  private clearDebounce(): void {
    if (this.debounceId !== undefined) {
      clearTimeout(this.debounceId);
      this.debounceId = undefined;
    }
  }
}
