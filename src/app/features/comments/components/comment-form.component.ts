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
    <form class="flex flex-col gap-3" (submit)="onSubmit($event)" novalidate>
      <textarea
        class="min-h-24 w-full rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        rows="3"
        [formField]="form.body"
        [attr.placeholder]="'comments.form.bodyPlaceholder' | transloco"
        data-testid="comment-form-input"
      ></textarea>
      <div class="flex justify-end">
        <button
          type="submit"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          [disabled]="!form().valid() || submitting()"
          data-testid="comment-form-submit"
        >
          {{ 'comments.form.submit' | transloco }}
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      :host {
        display: block;
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
