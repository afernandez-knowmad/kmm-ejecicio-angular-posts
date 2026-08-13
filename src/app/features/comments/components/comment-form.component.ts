import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { AuthStore } from '../../auth/auth.store';
import { toId } from '../../../core/lib/ids';
import { CommentsApi } from '../comments.api';
import type { Comment } from '../models/comment.model';

/**
 * Inline form to create a new comment on a post.
 *
 * On submit: builds NewComment from current user, calls
 * CommentsApi.create and emits the created comment.
 */
@Component({
  selector: 'app-comment-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslocoModule],
  template: `
    <form class="comment-form" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
      <textarea
        class="comment-form__input"
        rows="3"
        formControlName="body"
        [attr.placeholder]="'comments.form.bodyPlaceholder' | transloco"
        data-testid="comment-form-input"
      ></textarea>
      <button
        type="submit"
        class="comment-form__submit"
        [disabled]="form.invalid || submitting()"
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
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthStore);
  private readonly api = inject(CommentsApi);

  readonly postId = input.required<string>();
  readonly created = output<Comment>();

  protected readonly form = this.fb.nonNullable.group({
    body: ['', [Validators.required, Validators.minLength(2)]],
  });

  protected readonly submitting = signal(false);

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
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
    const body = this.form.controls.body.getRawValue().trim();
    if (body.length === 0) {
      this.form.controls.body.setErrors({ required: true });
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    try {
      // json-server does not always auto-generate timestamps on
      // POST, so we send one explicitly. Without it the new row is
      // persisted with `createdAt: undefined`, which then breaks the
      // store sort (NaN comparisons are unstable in V8).
      const createdAt = new Date().toISOString();
      const created = await this.api.create({ postId, userId, body, createdAt });
      this.created.emit(created);
      this.form.reset({ body: '' });
    } catch (err) {
       
      console.error('[comment-form] failed to post comment', err);
    } finally {
      this.submitting.set(false);
    }
  }
}
