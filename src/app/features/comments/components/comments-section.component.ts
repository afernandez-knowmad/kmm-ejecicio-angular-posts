import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { CommentsApi } from '../comments.api';
import { CommentsStore } from '../comments.store';
import type { Comment } from '../models/comment.model';
import { CommentItemComponent } from './comment-item.component';
import { CommentFormComponent } from './comment-form.component';

/**
 * Container component for the comments section of a post detail.
 *
 * Drives the httpResource for /comments?postId=..., feeds
 * CommentsStore, and renders explicit loading/error/empty/resolved
 * states.
 */
@Component({
  selector: 'app-comments-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, CommentItemComponent, CommentFormComponent],
  template: `
    <section class="comments-section" data-testid="comments-section">
      <h2 class="comments-section__title">{{ 'comments.list.title' | transloco }}</h2>

      <app-comment-form [postId]="postId()" (created)="onCreated($event)" />

      @switch (status()) {
        @case ('loading') {
          <p class="comments-section__state" data-testid="comments-loading">
            {{ 'comments.list.loading' | transloco }}
          </p>
        }
        @case ('error') {
          <p
            class="comments-section__state comments-section__state--error"
            role="alert"
            data-testid="comments-error"
          >
            {{ 'comments.list.error' | transloco }}
          </p>
        }
        @case ('ready') {
          @if (items().length === 0) {
            <p class="comments-section__state" data-testid="comments-empty">
              {{ 'comments.list.empty' | transloco }}
            </p>
          } @else {
            <ul class="comments-section__items" data-testid="comments-items">
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
          }
        }
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .comments-section__title {
        font-size: 1.125rem;
        font-weight: 700;
        margin: 0 0 0.5rem;
      }
      .comments-section__state {
        padding: 0.75rem;
        border-radius: 0.5rem;
        background: rgba(0, 0, 0, 0.04);
        margin-top: 0.75rem;
      }
      .comments-section__state--error {
        background: rgba(192, 57, 43, 0.1);
        color: #c0392b;
      }
      .comments-section__items {
        list-style: none;
        padding: 0;
        margin: 0.75rem 0 0;
        display: grid;
        gap: 0.5rem;
      }
    `,
  ],
})
export class CommentsSectionComponent {
  private readonly api = inject(CommentsApi);
  private readonly store = inject(CommentsStore);

  readonly postId = input.required<string>();

  protected readonly commentsResource = httpResource<Comment[]>(() =>
    this.api.listByPostRequest(() => this.postId()),
  );

  protected readonly items = this.store.forPost(() => this.postId());

  protected readonly status = computed(() => {
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
    // Feed the cache from every successful response.
    effect(() => {
      const value = this.commentsResource.value();
      if (value) {
        this.store.observe(this.postId(), value);
      }
    });
  }

  protected onCreated(comment: Comment): void {
    this.store.prepend(this.postId(), comment);
  }

  protected onUpdated(comment: Comment): void {
    this.store.replace(this.postId(), comment);
  }

  protected onDeleted(id: string): void {
    this.store.remove(this.postId(), id);
  }
}
