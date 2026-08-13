import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { AuthStore } from '../../auth/auth.store';
import { isOwner } from '../../../core/lib/ids';
import { UsersStore } from '../../posts/users.store';
import { CommentEditFormComponent } from './comment-edit-form.component';
import { CommentsApi } from '../comments.api';
import type { Comment } from '../models/comment.model';

/**
 * Presentational component for a single comment row.
 *
 * Resolves the author from UsersStore.byId, renders edit/delete
 * actions only when the current user owns the comment, and toggles
 * an inline edit form when the user opts to edit.
 */
@Component({
  selector: 'app-comment-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, CommentEditFormComponent],
  template: `
    <article class="comment-item" data-testid="comment-item">
      <header class="comment-item__header">
        <span class="comment-item__author">
          {{ authorName() }}
        </span>
      </header>

      @if (editing()) {
        <app-comment-edit-form
          [postId]="postId()"
          [comment]="comment()"
          (saved)="onSaved($event)"
          (cancelled)="onCancel()"
        />
      } @else {
        <p class="comment-item__body">{{ comment().body }}</p>
        @if (canEdit()) {
          <footer class="comment-item__actions" data-testid="comment-actions">
            <button
              type="button"
              class="comment-item__btn"
              (click)="startEdit()"
              data-testid="comment-edit-button"
            >
              {{ 'comments.actions.edit' | transloco }}
            </button>
            <button
              type="button"
              class="comment-item__btn comment-item__btn--delete"
              (click)="onDelete()"
              data-testid="comment-delete-button"
            >
              {{ 'comments.actions.delete' | transloco }}
            </button>
          </footer>
        }
      }
    </article>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .comment-item {
        padding: 0.75rem;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 0.5rem;
        background: #fff;
      }
      .comment-item__header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.375rem;
      }
      .comment-item__author {
        font-size: 0.8125rem;
        font-weight: 600;
      }
      .comment-item__body {
        margin: 0;
        font-size: 0.875rem;
        line-height: 1.45;
        white-space: pre-line;
      }
      .comment-item__actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      .comment-item__btn {
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;
        border: 1px solid rgba(0, 0, 0, 0.2);
        background: transparent;
        font-size: 0.75rem;
        cursor: pointer;
      }
      .comment-item__btn--delete:hover {
        background: rgba(192, 57, 43, 0.08);
        color: #c0392b;
      }
    `,
  ],
})
export class CommentItemComponent {
  private readonly auth = inject(AuthStore);
  private readonly usersStore = inject(UsersStore);
  private readonly api = inject(CommentsApi);

  readonly postId = input.required<string>();
  readonly comment = input.required<Comment>();

  readonly updated = output<Comment>();
  readonly deleted = output<{ id: string }>();

  protected readonly editing = signal(false);

  protected readonly canEdit = computed(() => isOwner(this.comment().userId, this.auth.user()?.id));

  protected readonly authorName = computed(() => {
    const user = this.usersStore.byId().get(this.comment().userId);
    return user?.name ?? `#${this.comment().userId}`;
  });

  constructor() {
    void this.usersStore.ensureLoaded();
  }

  protected startEdit(): void {
    this.editing.set(true);
  }

  protected onSaved(comment: Comment): void {
    this.editing.set(false);
    this.updated.emit(comment);
  }

  protected onCancel(): void {
    this.editing.set(false);
  }

  protected async onDelete(): Promise<void> {
    const id = this.comment().id;
    await this.api.delete(id);
    this.deleted.emit({ id });
  }
}
