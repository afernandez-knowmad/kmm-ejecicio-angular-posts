import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { TranslocoModule } from '@jsverse/transloco';

import { CommentsApi } from '../comments.api';
import type { Comment } from '../models/comment.model';

interface CommentEditModel {
  body: string;
}

@Component({
  selector: 'app-comment-edit-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, TranslocoModule],
  template: `
    <form class="flex flex-col gap-3" (submit)="onSubmit($event)" novalidate>
      <textarea
        class="min-h-24 w-full rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        rows="3"
        [formField]="form.body"
        data-testid="comment-edit-input"
      ></textarea>
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100"
          (click)="onCancel()"
          data-testid="comment-edit-cancel"
        >
          {{ 'comments.form.cancel' | transloco }}
        </button>
        <button
          type="submit"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          [disabled]="!form().valid() || submitting()"
          data-testid="comment-edit-submit"
        >
          {{ 'comments.form.save' | transloco }}
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
export class CommentEditFormComponent {
  private readonly api = inject(CommentsApi);

  readonly postId = input.required<string>();
  readonly comment = input.required<Comment>();

  readonly saved = output<Comment>();
  readonly cancelled = output<void>();

  protected readonly editModel = signal<CommentEditModel>({ body: '' });
  protected readonly form = form(this.editModel, (p) => {
    required(p.body);
    minLength(p.body, 2);
  });

  protected readonly submitting = signal(false);

  // Re-sembramos solo cuando cambia el id. `untracked()` rompe la
  // dependencia del modelo para que la escritura no re-dispare el
  // effect (bucle bajo OnPush).
  private lastSeededId: string | null = null;

  constructor() {
    effect(() => {
      const c = this.comment();
      if (this.lastSeededId !== c.id) {
        this.lastSeededId = c.id;
        const current = untracked(() => this.editModel().body);
        if (current !== c.body) {
          this.editModel.set({ body: c.body });
        }
      }
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.form().valid() || this.submitting()) {
      this.form().markAsTouched();
      return;
    }
    const body = this.editModel().body.trim();
    if (body.length === 0) {
      return;
    }
    this.submitting.set(true);
    void this.updateComment(body);
  }

  private async updateComment(body: string): Promise<void> {
    try {
      const updated = await this.api.update(this.comment().id, { body });
      this.saved.emit(updated);
    } finally {
      this.submitting.set(false);
    }
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}
