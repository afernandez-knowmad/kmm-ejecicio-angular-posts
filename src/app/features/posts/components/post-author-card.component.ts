import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { UsersStore } from '../users.store';

/**
 * Presentational card showing the post author. Resolves the name
 * from UsersStore.byId; falls back to the userId until the store
 * loads.
 */
@Component({
  selector: 'app-post-author-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule],
  template: `
    <aside class="post-author" data-testid="post-author-card">
      <span class="post-author__label">{{ 'posts.detail.by' | transloco }}</span>
      <strong class="post-author__name">{{ authorName() }}</strong>
    </aside>
  `,
  styles: [
    `
      .post-author {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.625rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.05);
        font-size: 0.8125rem;
      }
      .post-author__label {
        opacity: 0.7;
      }
    `,
  ],
})
export class PostAuthorCardComponent {
  private readonly usersStore = inject(UsersStore);

  readonly userId = input.required<string>();

  protected readonly authorName = computed(() => {
    const user = this.usersStore.byId().get(this.userId());
    return user?.name ?? `#${this.userId()}`;
  });

  constructor() {
    void this.usersStore.ensureLoaded();
  }
}
