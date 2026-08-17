import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { form, FormField, minLength, required, validate } from '@angular/forms/signals';
import { TranslocoModule } from '@jsverse/transloco';

import { AuthStore } from '@features/auth/auth.store';
import { toId } from '@core/lib/ids';
import { CommentsApi } from '../comments.api';
import type { Comment } from '../models/comment.model';

interface CommentFormModel {
  body: string;
}

@Component({
  selector: 'app-comment-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, TranslocoModule],
  template: `
    <form
      class="flex flex-col gap-4 rounded-xl bg-slate-50 p-5"
      (submit)="onSubmit($event)"
      novalidate
      data-testid="comment-form"
    >
      <label
        class="text-sm font-semibold text-slate-900"
        for="comment-form-input"
        data-testid="comment-form-label"
      >
        {{ 'comments.form.label' | transloco }}
      </label>
      <textarea
        id="comment-form-input"
        class="min-h-24 w-full rounded-lg bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
    // Los ids se manejan como string de extremo a extremo. El filtro de
    // json-server y los POST aceptan strings numéricos o
    // alfanuméricos, así que nunca coercemos con `Number()`: los
    // posts creados dinámicamente reciben ids como `"n1I0hof7I3o"`
    // que se irían a NaN y romperían el create en silencio.
    const postId = toId(this.postId());
    const userId = toId(this.auth.user()?.id);
    if (postId.length === 0) {
      console.error('[comment-form] missing postId; cannot post comment');
      return;
    }
    if (userId.length === 0) {
      // El auth guard evita esta rama en la práctica, pero si la
      // sesión expira a mitad de uso no queremos un no-op silencioso.

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
      // json-server no siempre autogenera timestamps en el POST, así
      // que mandamos uno explícito. Si no, la fila persistida queda
      // con `createdAt: undefined`, que rompe el sort del store (las
      // comparaciones con NaN son inestables en V8).
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
