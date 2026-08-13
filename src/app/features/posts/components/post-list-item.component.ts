import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { toId } from '../../../core/lib/ids';
import { AvatarComponent } from '../../../shared/ui/avatar.component';
import { UsersStore } from '../users.store';
import type { Post } from '../models/post.model';

/**
 * Presentational component that renders a single post as a card.
 *
 * Resolves the author from UsersStore and renders tags. Author lookup
 * is best-effort: until UsersStore loads, we fall back to the userId.
 */
@Component({
  selector: 'app-post-list-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, RouterLink, AvatarComponent],
  host: { class: 'block' },
  template: `
    <article
      class="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/70 transition-shadow hover:shadow-md"
      data-testid="post-item"
    >
      <a
        class="absolute inset-0 z-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-brand-500"
        [routerLink]="['/posts', post().id]"
        [attr.aria-label]="ariaLabel()"
        data-testid="post-item-link"
      ></a>

      <time
        class="absolute right-5 top-4 text-xs font-medium uppercase tracking-wide text-slate-400"
        [attr.datetime]="post().createdAt"
        data-testid="post-date"
      >
        {{ formattedDate() }}
      </time>

      <h2 class="mb-2 pr-16 text-lg font-semibold text-slate-900">{{ post().title }}</h2>
      <p class="mb-4 line-clamp-2 text-sm text-slate-500">{{ post().body }}</p>

      <div class="relative z-10 flex items-center justify-between gap-4">
        <div class="flex items-center gap-2" data-testid="post-author">
          <app-avatar [name]="authorName()" [size]="28" />
          <span class="text-sm font-medium text-slate-700">{{ authorName() }}</span>
        </div>

        @if (post().tags.length > 0) {
          <ul class="flex flex-wrap items-center gap-2" data-testid="post-tags">
            @for (tag of post().tags; track tag) {
              <li
                class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                {{ tag }}
              </li>
            }
          </ul>
        }
      </div>
    </article>
  `,
})
export class PostListItemComponent {
  private readonly usersStore = inject(UsersStore);
  private readonly transloco = inject(TranslocoService);

  readonly post = input.required<Post>();

  protected readonly authorName = computed(() => {
    const id = toId(this.post().userId);
    const user = this.usersStore.byId().get(id);
    return user?.name ?? `#${id}`;
  });

  protected readonly formattedDate = computed(() => {
    const iso = this.post().createdAt;
    if (!iso) {
      return '';
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat(this.lang(), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  });

  /**
   * Accessible label for the wrapping link. Built from the post title
   * so screen readers announce it as a navigation target rather than a
   * bare "link".
   */
  protected readonly ariaLabel = computed(() => this.post().title);

  private readonly lang = computed(() => this.transloco.getActiveLang());

  constructor() {
    void this.usersStore.ensureLoaded();
  }
}
