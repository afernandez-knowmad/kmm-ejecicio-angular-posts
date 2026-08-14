import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { CommentsApi } from '../comments.api';
import { CommentsStore } from '../comments.store';
import type { Comment } from '../models/comment.model';
import type { ServerPage } from '@features/posts/models/post-filters.model';
import { EmptyStateComponent } from '@shared/ui/empty-state.component';
import { ErrorStateComponent } from '@shared/ui/error-state.component';
import { LoadingStateComponent } from '@shared/ui/loading-state.component';
import { CommentItemComponent } from './comment-item.component';
import { CommentFormComponent } from './comment-form.component';

/**
 * Container component for the comments section of a post detail.
 *
 * Drives the httpResource for the FIRST page of `/comments?postId=...`,
 * feeds CommentsStore, and renders explicit loading/error/empty/resolved
 * states. Subsequent pages are loaded on demand via the "Cargar más"
 * button at the bottom of the list — see `onLoadMore`.
 */
@Component({
  selector: 'app-comments-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    CommentItemComponent,
    CommentFormComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  template: `
    <section class="flex flex-col gap-5" data-testid="comments-section">
      <h2 class="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {{ 'comments.list.title' | transloco: { count: items().length } }}
      </h2>

      @switch (displayState()) {
        @case ('loading') {
          <app-loading-state labelKey="comments.list.loading" testId="comments-loading" />
        }
        @case ('error') {
          <app-error-state labelKey="comments.list.error" testId="comments-error" />
        }
        @case ('ready') {
          @if (items().length === 0) {
            <app-empty-state labelKey="comments.list.empty" testId="comments-empty" />
          } @else {
            <ul class="flex flex-col gap-4" data-testid="comments-items">
              @for (comment of items(); track comment.id) {
                <li>
                  <app-comment-item
                    [postId]="postId()"
                    [comment]="comment"
                    (updated)="onUpdated($event)"
                    (deleted)="onDeleted($event.id)"
                  />
                </li>
              }
            </ul>

            @if (hasMore()) {
              <div class="flex justify-center">
                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  (click)="onLoadMore()"
                  [disabled]="loadingMore()"
                  data-testid="comments-load-more"
                >
                  @if (loadingMore()) {
                    {{ 'comments.list.loadingMore' | transloco }}
                  } @else {
                    {{ 'comments.list.loadMore' | transloco }}
                  }
                </button>
              </div>
            } @else {
              <p class="text-center text-xs text-slate-400" data-testid="comments-end">
                {{ 'comments.list.end' | transloco }}
              </p>
            }
          }
        }
      }

      <app-comment-form [postId]="postId()" (created)="onCreated($event)" />
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class CommentsSectionComponent {
  private readonly api = inject(CommentsApi);
  private readonly store = inject(CommentsStore);

  readonly postId = input.required<string>();

  /** Next page to fetch when the user clicks "Cargar más". */
  private readonly nextPage = signal(2);

  protected readonly commentsResource = httpResource<ServerPage<Comment>>(() =>
    this.api.listByPostRequest(() => this.postId()),
  );

  protected readonly items = this.store.forPost(() => this.postId());
  protected readonly hasMore = this.store.hasMoreFor(() => this.postId());
  protected readonly loadingMore = this.store.loadingMoreFor(() => this.postId());

  /**
   * Display state for the switch.
   *
   * The cache (`items()`) is the source of truth for what to draw.
   * We only fall back to the loading/error branches when the cache
   * has no data to show yet — otherwise we'd flash a spinner on
   * every local mutation (create/edit/delete) when `reload()`
   * briefly drives the resource to `'reloading'`, hiding the
   * optimistic update we just pushed into the store.
   */
  protected readonly displayState = computed(() => {
    const hasItems = this.items().length > 0;
    if (hasItems) {
      return 'ready' as const;
    }
    const r = this.commentsResource;
    if (r.status() === 'loading' || r.status() === 'reloading') {
      return 'loading' as const;
    }
    if (r.status() === 'error') {
      return 'error' as const;
    }
    return 'ready' as const;
  });

  constructor() {
    // Track the last resource value we have already pushed into the
    // store. The httpResource that backs `commentsResource` does NOT
    // refetch on PATCH/DELETE, so after a local edit/delete its value
    // still holds the pre-mutation list. The Angular effect graph
    // around httpResource still re-fires us for unrelated reasons
    // (request function re-evaluation, status transitions, etc.),
    // and without this guard each such re-fire would clobber the
    // local mutation in the cache with the stale server snapshot —
    // making the UI look like the edit "didn't take" until a manual
    // refresh. By identity-checking the incoming value we only sync
    // when the resource genuinely produced a new array.
    let lastSyncedValue: ServerPage<Comment> | undefined;
    effect(() => {
      const value = this.commentsResource.value();
      if (value === undefined) {
        return;
      }
      if (value === lastSyncedValue) {
        return;
      }
      lastSyncedValue = value;
      const hasMore = value.next !== null;
      this.store.observe(this.postId(), value.data, hasMore);
      // Recompute the next page from the actual response so we
      // never request a page beyond `last`.
      this.nextPage.set((value.next ?? value.last) + 1);
    });
  }

  /**
   * Fetch the next page from the api and ingest it via the store.
   * The `loadingMore` flag is set synchronously so the user cannot
   * trigger a second request while this one is in flight.
   */
  protected async onLoadMore(): Promise<void> {
    if (!this.hasMore() || this.loadingMore()) {
      return;
    }
    const postId = this.postId();
    const page = this.nextPage();
    this.store.setLoadingMore(postId, true);

    try {
      const response = await this.api.listByPostOnce(postId, page);
      this.store.loadMore(postId, response.data, response.next !== null);
      this.nextPage.set((response.next ?? response.last) + 1);
    } catch {
      // Reset so the user can retry by clicking the button again.
      this.store.setLoadingMore(postId, false);
    }
  }

  protected onCreated(comment: Comment): void {
    // Local-first: prepend the new comment so it shows up at the
    // top of the list (newest first, oldest at the bottom), then
    // force a refetch so the cache reconciles with the backend.
    // Using `prepend` keeps the cache sort invariant in the hands
    // of the store instead of relying on the caller to know the
    // current ordering.
    this.store.prepend(this.postId(), comment);
    this.commentsResource.reload();
  }

  protected onUpdated(comment: Comment): void {
    this.store.replace(this.postId(), comment);
  }

  protected onDeleted(id: string): void {
    this.store.remove(this.postId(), id);
  }
}
