import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { UsersStore } from '../users.store';
import type { Post } from '../models/post.model';

/**
 * Presentational component that renders a single post as a card.
 *
 * Resolves the author name from UsersStore and renders tags. Author
 * lookup is best-effort: until UsersStore loads, we show the userId.
 */
@Component({
  selector: 'app-post-list-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule],
  template: `
    <article class="post-card" data-testid="post-item">
      <h2 class="post-card__title">{{ post().title }}</h2>
      <p class="post-card__body">{{ post().body }}</p>
      <footer class="post-card__footer">
        <span class="post-card__author" data-testid="post-author">
          {{ 'posts.list.by' | transloco }} <strong>{{ authorName() }}</strong>
        </span>
        @if (post().tags.length > 0) {
          <ul class="post-card__tags" data-testid="post-tags">
            @for (tag of post().tags; track tag) {
              <li class="post-card__tag">#{{ tag }}</li>
            }
          </ul>
        }
      </footer>
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .post-card {
        padding: 1rem;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 0.5rem;
        background: #fff;
      }
      .post-card__title {
        font-size: 1.0625rem;
        margin: 0 0 0.25rem;
        font-weight: 600;
      }
      .post-card__body {
        margin: 0 0 0.75rem;
        font-size: 0.875rem;
        opacity: 0.85;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .post-card__footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .post-card__author {
        font-size: 0.8125rem;
        opacity: 0.85;
      }
      .post-card__tags {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
      }
      .post-card__tag {
        font-size: 0.75rem;
        padding: 0.125rem 0.5rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.05);
      }
    `,
  ],
})
export class PostListItemComponent {
  private readonly usersStore = inject(UsersStore);

  readonly post = input.required<Post>();

  protected readonly authorName = computed(() => {
    const user = this.usersStore.byId().get(this.post().userId);
    return user?.name ?? `#${this.post().userId}`;
  });

  constructor() {
    void this.usersStore.ensureLoaded();
  }
}
