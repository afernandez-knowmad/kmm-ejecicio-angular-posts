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

  // El `equal` custom es obligatorio: el source thunk devuelve un `{ q }`
  // nuevo en cada evaluación, así que el `Object.is` por defecto
  // marcaría cada re-evaluación como cambio y entraría en bucle
  // con el `setQuery` debounced.
  protected readonly model = linkedSignal<SearchModel, SearchModel>({
    source: () => ({ q: this.queryState.q() }),
    computation: (source) => source,
    equal: (a, b) => a.q === b.q,
  });
  protected readonly form = form(this.model);

  private debounceId: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => this.clearDebounce());

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
