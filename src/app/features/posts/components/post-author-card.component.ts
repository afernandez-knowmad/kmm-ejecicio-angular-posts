import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { toId } from '../../../core/lib/ids';
import { UsersStore } from '../users.store';

/**
 * Presentational card showing the post author. Resolves the name
 * from UsersStore.byId; falls back to the userId until the store
 * loads.
 *
 * The lookup normalises the incoming id to a string because the mock
 * backend stores `userId` as a number on posts while `users[].id` is
 * a string, so a raw `Map.get` would always miss.
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
    const id = toId(this.userId());
    const user = this.usersStore.byId().get(id);
    return user?.name ?? `#${id}`;
  });

  constructor() {
    void this.usersStore.ensureLoaded();
  }
}
