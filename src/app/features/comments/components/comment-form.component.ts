import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, minLength, required, validate } from '@angular/forms/signals';
import { TranslocoModule } from '@jsverse/transloco';

import { AuthStore } from '../../auth/auth.store';
import { toId } from '../../../core/lib/ids';
import { CommentsApi } from '../comments.api';
import type { Comment } from '../models/comment.model';

interface CommentFormModel {
  body: string;
}

/**
 * Inline form to create a new comment on a post.
 *
 * On submit: builds NewComment from current user, calls
 * CommentsApi.create and emits the created comment.
 */
@Component({
  selector: 'app-comment-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, TranslocoModule],
  template: `
    <form class="comment-form" (submit)="onSubmit($event)" novalidate>
      <textarea
        class="comment-form__input"
        rows="3"
        [formField]="form.body"
        [attr.placeholder]="'comments.form.bodyPlaceholder' | transloco"
        data-testid="comment-form-input"
      ></textarea>
      <button
        type="submit"
        class="comment-form__submit"
        [disabled]="!form().valid() || submitting()"
        data-testid="comment-form-submit"
      >
        {{ 'comments.form.submit' | transloco }}
      </button>
    </form>
  `,
  styles: [
    `
      .comment-form {
        display: flex;
        gap: 0.5rem;
        align-items: flex-start;
        margin-top: 0.5rem;
      }
      .comment-form__input {
        flex: 1;
        padding: 0.5rem 0.625rem;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 0.375rem;
        font: inherit;
        background: transparent;
        resize: vertical;
      }
      .comment-form__submit {
        padding: 0.5rem 0.875rem;
        border-radius: 0.5rem;
        border: 0;
        background: #2563eb;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
      }
      .comment-form__submit[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class CommentFormComponent {
  private readonly auth = inject(AuthStore);
  private readonly api = inject(CommentsApi);

  readonly postId = input.required<string>();
  readonly created = output<Comment>();

  protected readonly commentModel = signal<CommentFormModel>({ body: '' });
  protected readonly form = form(this.commentModel, (p) => {
    required(p.body);
    minLength(p.body, 2);
    validate(p.body, ({ value }) => {
      const body = value().trim();
      return body.length === 0 ? { kind: 'required' } : undefined;
    });
  });

  protected readonly submitting = signal(false);

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.form().valid() || this.submitting()) {
      this.form().markAsTouched();
      return;
    }
    // ids are kept as strings end-to-end. json-server's query filter
    // and POST payloads accept either numeric or alphanumeric
    // strings, so we never coerce with `Number()` — posts created
    // dynamically get ids like `"n1I0hof7I3o"` which would NaN-out
    // and silently break the create flow.
    const postId = toId(this.postId());
    const userId = toId(this.auth.user()?.id);
    if (postId.length === 0) {
      console.error('[comment-form] missing postId; cannot post comment');
      return;
    }
    if (userId.length === 0) {
      // The auth guard prevents this branch in practice, but if the
      // session expires mid-session we don't want a silent no-op.

      console.error('[comment-form] missing userId; cannot post comment');
      return;
    }
    const body = this.commentModel().body.trim();
    if (body.length === 0) {
      this.form().markAsTouched();
      return;
    }
    this.submitting.set(true);
    void this.createComment(postId, userId, body);
  }

  private async createComment(postId: string, userId: string, body: string): Promise<void> {
    try {
      // json-server does not always auto-generate timestamps on
      // POST, so we send one explicitly. Without it the new row is
      // persisted with `createdAt: undefined`, which then breaks the
      // store sort (NaN comparisons are unstable in V8).
      const createdAt = new Date().toISOString();
      const created = await this.api.create({ postId, userId, body, createdAt });
      this.created.emit(created);
      this.form().reset({ body: '' });
    } catch (err) {
      console.error('[comment-form] failed to post comment', err);
    } finally {
      this.submitting.set(false);
    }
  }
}
