import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { IconComponent } from '@shared/ui/icon/icon.component';
import { PostsQueryState } from '../posts.query-state';

@Component({
  selector: 'app-posts-tag-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, IconComponent],
  template: `
    <label
      class="flex items-stretch overflow-hidden rounded-lg border border-slate-200 bg-slate-100 transition-colors focus-within:border-brand-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500"
      data-testid="posts-tag-filter-wrapper"
    >
      <span
        class="flex items-center bg-slate-200/70 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
      >
        {{ 'posts.filters.tagLabel' | transloco }}
      </span>
      <select
        class="w-full appearance-none bg-transparent py-2.5 pl-3 pr-2 text-sm text-slate-900 focus:outline-none"
        [value]="current()"
        (change)="onChange($event)"
        data-testid="posts-tag-filter"
      >
        <option value="">{{ 'posts.filters.anyTag' | transloco }}</option>
        @for (tag of tags(); track tag) {
          <option [value]="tag">{{ tag }}</option>
        }
      </select>
      <span class="pointer-events-none flex items-center pr-3 text-slate-400" aria-hidden="true">
        <app-icon name="chevron-down" [size]="16" />
      </span>
    </label>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class PostsTagFilterComponent {
  private readonly queryState = inject(PostsQueryState);

  readonly tags = input.required<readonly string[]>();

  protected readonly current = computed(() => this.queryState.tag() ?? '');

  protected onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.queryState.setQuery({ tag: value || undefined });
  }
}
