import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { debounce, form, FormField } from '@angular/forms/signals';
import { TranslocoModule } from '@jsverse/transloco';

import { IconComponent } from '../../../shared/ui/icon/icon.component';
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
  imports: [FormField, TranslocoModule, IconComponent],
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
