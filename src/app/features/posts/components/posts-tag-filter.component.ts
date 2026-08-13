import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { PostsQueryState } from '../posts.query-state';

/**
 * Dropdown that filters posts by tag.
 *
 * Tag options are passed in by the parent page as a `tags` input,
 * derived from the current page of posts. Empty string resets the
 * active tag.
 */
@Component({
  selector: 'app-posts-tag-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, IconComponent],
  template: `
    <label class="relative flex items-center">
      <span
        class="pointer-events-none absolute left-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
      >
        {{ 'posts.filters.tagLabel' | transloco }}
      </span>
      <select
        class="w-full appearance-none rounded-lg bg-slate-100 py-2.5 pl-20 pr-9 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        [value]="current()"
        (change)="onChange($event)"
        data-testid="posts-tag-filter"
      >
        <option value="">{{ 'posts.filters.anyTag' | transloco }}</option>
        @for (tag of tags(); track tag) {
          <option [value]="tag">{{ tag }}</option>
        }
      </select>
      <app-icon
        name="chevron-down"
        [size]="16"
        class="pointer-events-none absolute right-3 text-slate-400"
      />
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

  /** Tags to render as options. Provided by the parent page. */
  readonly tags = input.required<readonly string[]>();

  protected readonly current = computed(() => this.queryState.tag() ?? '');

  protected onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.queryState.setQuery({ tag: value || undefined });
  }
}
