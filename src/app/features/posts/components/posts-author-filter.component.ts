import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { PostsQueryState } from '../posts.query-state';
import { UsersStore } from '../users.store';

/**
 * Dropdown that filters posts by author id.
 *
 * Options are derived from UsersStore so adding a user to the seed
 * data automatically becomes a filter option.
 */
@Component({
  selector: 'app-posts-author-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule],
  template: `
    <label class="posts-author-filter">
      <span class="posts-author-filter__label">{{ 'posts.filters.authorLabel' | transloco }}</span>
      <select
        class="posts-author-filter__select"
        [value]="current()"
        (change)="onChange($event)"
        data-testid="posts-author-filter"
      >
        <option value="">{{ 'posts.filters.anyAuthor' | transloco }}</option>
        @for (user of users(); track user.id) {
          <option [value]="user.id">{{ user.name }}</option>
        }
      </select>
    </label>
  `,
  styles: [
    `
      .posts-author-filter {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .posts-author-filter__label {
        font-size: 0.8125rem;
        font-weight: 500;
      }
      .posts-author-filter__select {
        padding: 0.5rem 0.625rem;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 0.375rem;
        background: transparent;
        font: inherit;
      }
    `,
  ],
})
export class PostsAuthorFilterComponent {
  private readonly usersStore = inject(UsersStore);
  private readonly queryState = inject(PostsQueryState);

  protected readonly users = this.usersStore.users;
  protected readonly current = computed(() => this.queryState.userId() ?? '');

  constructor() {
    void this.usersStore.ensureLoaded();
  }

  protected onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.queryState.setQuery({ userId: value || undefined });
  }
}
