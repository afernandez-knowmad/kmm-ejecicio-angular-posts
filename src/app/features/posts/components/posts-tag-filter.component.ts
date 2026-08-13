import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { PostsQueryState } from '../posts.query-state';

/**
 * Chip group that filters posts by tag.
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
    <fieldset class="posts-tag-filter" data-testid="posts-tag-filter">
      <legend class="posts-tag-filter__label">{{ 'posts.filters.tagLabel' | transloco }}</legend>
      <div class="posts-tag-filter__chips">
        @for (tag of tags(); track tag) {
          <button
            type="button"
            class="posts-tag-filter__chip"
            [class.is-active]="current() === tag"
            (click)="onToggle(tag)"
            [attr.aria-pressed]="current() === tag"
          >
            #{{ tag }}
          </button>
        }
        @if (current()) {
          <button
            type="button"
            class="posts-tag-filter__clear"
            (click)="onClear()"
            data-testid="posts-tag-clear"
          >
            {{ 'posts.filters.clearTag' | transloco }}
          </button>
        }
      </div>
    </fieldset>
  `,
  styles: [
    `
      .posts-tag-filter {
        border: 0;
        padding: 0;
        margin: 0;
      }
      .posts-tag-filter__label {
        font-size: 0.8125rem;
        font-weight: 500;
        margin-bottom: 0.25rem;
      }
      .posts-tag-filter__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
      }
      .posts-tag-filter__chip,
      .posts-tag-filter__clear {
        font-size: 0.75rem;
        padding: 0.25rem 0.625rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.05);
        border: 1px solid transparent;
        cursor: pointer;
      }
      .posts-tag-filter__chip.is-active {
        background: #2563eb;
        color: #fff;
        border-color: #2563eb;
      }
      .posts-tag-filter__clear {
        background: transparent;
        border-color: rgba(0, 0, 0, 0.2);
      }
    `,
  ],
})
export class PostsTagFilterComponent {
  private readonly queryState = inject(PostsQueryState);

  /** Tags to render as chips. Provided by the parent page. */
  readonly tags = input.required<readonly string[]>();

  protected readonly current = computed(() => this.queryState.tag() ?? '');

  protected onToggle(tag: string): void {
    const current = this.current();
    this.queryState.setQuery({ tag: current === tag ? undefined : tag });
  }

  protected onClear(): void {
    this.queryState.setQuery({ tag: undefined });
  }
}
