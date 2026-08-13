import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { AuthStore } from '../../auth/auth.store';
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
    const userId = this.auth.user()?.id;
    if (!userId) {
      return;
    }
    const body = this.form.controls.body.getRawValue().trim();
    if (body.length === 0) {
      return;
    }
    this.submitting.set(true);
    try {
      const created = await this.api.create({ postId: this.postId(), userId, body });
      this.created.emit(created);
      this.form.reset({ body: '' });
    } finally {
      this.submitting.set(false);
    }
  }
}
