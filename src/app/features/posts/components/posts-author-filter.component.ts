import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { IconComponent } from '@shared/ui/icon/icon.component';
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
  imports: [TranslocoModule, IconComponent],
  template: `
    <label class="relative flex items-center">
      <span
        class="pointer-events-none absolute left-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
      >
        {{ 'posts.filters.authorLabel' | transloco }}
      </span>
      <select
        class="w-full appearance-none rounded-lg bg-slate-100 py-2.5 pl-24 pr-9 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        [value]="current()"
        (change)="onChange($event)"
        data-testid="posts-author-filter"
      >
        <option value="">{{ 'posts.filters.anyAuthor' | transloco }}</option>
        @for (user of users(); track user.id) {
          <option [value]="user.id">{{ user.name }}</option>
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
