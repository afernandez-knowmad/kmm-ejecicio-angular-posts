import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { debounce, form, FormField } from '@angular/forms/signals';
import { TranslocoModule } from '@jsverse/transloco';

import { PostsQueryState } from '../posts.query-state';

interface PostsSearchModel {
  q: string;
}

/**
 * Debounced text search input. Emits changes through PostsQueryState
 * so the URL stays in sync.
 */
@Component({
  selector: 'app-posts-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, TranslocoModule],
  template: `
    <label class="posts-search">
      <span class="posts-search__label">{{ 'posts.filters.searchLabel' | transloco }}</span>
      <input
        type="search"
        class="posts-search__input"
        [formField]="form.q"
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
  private readonly queryState = inject(PostsQueryState);

  protected readonly searchModel = signal<PostsSearchModel>({
    q: this.queryState.q(),
  });
  protected readonly form = form(this.searchModel, (p) => {
    debounce(p.q, 250);
  });

  constructor() {
    // Keep the input in sync if the query changes externally (e.g.
    // browser back/forward navigation). A query that merely trims the
    // current input is allowed to remain untrimmed in the control.
    effect(() => {
      const q = this.queryState.q();
      const current = this.searchModel().q;
      if (q !== current && q !== current.trim()) {
        this.searchModel.set({ q });
      }
    });

    effect(() => {
      const q = this.searchModel().q.trim() || undefined;
      const currentQ = this.queryState.query().q;
      if (q !== currentQ) {
        this.queryState.setQuery({ q });
      }
    });
  }
}
