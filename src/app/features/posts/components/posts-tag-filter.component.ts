import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

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
  imports: [TranslocoModule],
  template: `
    <label class="posts-tag-filter">
      <span class="posts-tag-filter__label">{{ 'posts.filters.tagLabel' | transloco }}</span>
      <select
        class="posts-tag-filter__select"
        [value]="current()"
        (change)="onChange($event)"
        data-testid="posts-tag-filter"
      >
        <option value="">{{ 'posts.filters.anyTag' | transloco }}</option>
        @for (tag of tags(); track tag) {
          <option [value]="tag">{{ tag }}</option>
        }
      </select>
    </label>
  `,
  styles: [
    `
      .posts-tag-filter {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .posts-tag-filter__label {
        font-size: 0.8125rem;
        font-weight: 500;
      }
      .posts-tag-filter__select {
        padding: 0.5rem 0.625rem;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 0.375rem;
        background: transparent;
        font: inherit;
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
