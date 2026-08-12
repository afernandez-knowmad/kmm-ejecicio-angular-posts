import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { PostsQueryState } from '../posts.query-state';

/**
 * Debounced text search input. Emits changes through PostsQueryState
 * so the URL stays in sync.
 */
@Component({
  selector: 'app-posts-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslocoModule],
  template: `
    <label class="posts-search">
      <span class="posts-search__label">{{ 'posts.filters.searchLabel' | transloco }}</span>
      <input
        type="search"
        class="posts-search__input"
        [formControl]="control"
        [attr.placeholder]="'posts.filters.searchPlaceholder' | transloco"
        data-testid="posts-search-input"
      />
    </label>
  `,
  styles: [
    `
      .posts-search {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .posts-search__label {
        font-size: 0.8125rem;
        font-weight: 500;
      }
      .posts-search__input {
        padding: 0.5rem 0.625rem;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 0.375rem;
        font: inherit;
      }
    `,
  ],
})
export class PostsSearchComponent {
  private readonly fb = inject(FormBuilder);
  private readonly queryState = inject(PostsQueryState);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly control = this.fb.nonNullable.control('');

  // Initialise the input from the current query once.
  private readonly initialised = signal(false);

  constructor() {
    this.control.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.queryState.setQuery({ q: value.trim() || undefined });
      });

    // Keep the input in sync if the query changes externally (e.g.
    // browser back/forward navigation).
    effect(() => {
      const q = this.queryState.q() ?? '';
      if (q !== this.control.value && !this.initialised()) {
        this.control.setValue(q, { emitEvent: false });
        this.initialised.set(true);
      }
    });
  }
}
