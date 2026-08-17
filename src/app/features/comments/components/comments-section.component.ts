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
 * Componente contenedor de la sección de comentarios en el detalle.
 *
 * Mueve el httpResource para la PRIMERA página de
 * `/comments?postId=...`, alimenta CommentsStore y pinta los
 * estados loading/error/empty/resolved. Las páginas siguientes se
 * cargan bajo demanda con el botón "Cargar más" (ver `onLoadMore`).
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

  private readonly nextPage = signal(2);

  protected readonly commentsResource = httpResource<ServerPage<Comment>>(() =>
    this.api.listByPostRequest(() => this.postId()),
  );

  protected readonly items = this.store.forPost(() => this.postId());
  protected readonly hasMore = this.store.hasMoreFor(() => this.postId());
  protected readonly loadingMore = this.store.loadingMoreFor(() => this.postId());

  // Estado a pintar en el @switch.
  //
  // La fuente de verdad es la caché (`items()`). Solo caemos a
  // loading/error cuando la caché aún no tiene nada — si no, cada
  // mutación local (create/edit/delete) haría que `reload()` lleve
  // brevemente el recurso a 'reloading' y oculte el update
  // optimista que acabamos de empujar al store.
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
    // httpResource no refetchea en PATCH/DELETE, pero el grafo de
    // effects sí re-dispara por motivos no relacionados. Comparar
    // por identidad evita pisar la mutación local con el snapshot
    // viejo del servidor.
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
      this.nextPage.set((value.next ?? value.last) + 1);
    });
  }

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
      // Reseteamos para que el usuario pueda reintentar pulsando el botón.
      this.store.setLoadingMore(postId, false);
    }
  }

  protected onCreated(comment: Comment): void {
    // Local-first: prependeamos el comentario para que aparezca
    // arriba (más reciente primero) y luego forzamos refetch para
    // reconciliar la caché con el backend. Usar `prepend` deja el
    // invariante de orden en manos del store en vez de obligar al
    // caller a conocer el orden actual.
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
