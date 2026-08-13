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

/**
 * Inline edit form for a comment. Seeds its value from the input
 * comment via effect() and emits 'saved' on submit.
 */
@Component({
  selector: 'app-comment-edit-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, TranslocoModule],
  template: `
    <form class="comment-edit-form" (submit)="onSubmit($event)" novalidate>
      <textarea
        class="comment-edit-form__input"
        rows="3"
        [formField]="form.body"
        data-testid="comment-edit-input"
      ></textarea>
      <div class="comment-edit-form__actions">
        <button
          type="submit"
          class="comment-edit-form__btn"
          [disabled]="!form().valid() || submitting()"
          data-testid="comment-edit-submit"
        >
          {{ 'comments.form.save' | transloco }}
        </button>
        <button
          type="button"
          class="comment-edit-form__btn comment-edit-form__btn--cancel"
          (click)="onCancel()"
          data-testid="comment-edit-cancel"
        >
          {{ 'comments.form.cancel' | transloco }}
        </button>
      </div>
    </form>
  `,
  styles: [
    `
      .comment-edit-form {
        display: flex;
        gap: 0.5rem;
        align-items: flex-start;
        margin-top: 0.25rem;
      }
      .comment-edit-form__input {
        flex: 1;
        padding: 0.5rem 0.625rem;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 0.375rem;
        font: inherit;
        background: transparent;
        resize: vertical;
      }
      .comment-edit-form__actions {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .comment-edit-form__btn {
        padding: 0.5rem 0.875rem;
        border-radius: 0.5rem;
        border: 0;
        background: #2563eb;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
      }
      .comment-edit-form__btn--cancel {
        background: transparent;
        color: inherit;
        border: 1px solid rgba(0, 0, 0, 0.2);
      }
      .comment-edit-form__btn[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
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

  /**
   * Tracks which comment id the form has been seeded for. We only
   * seed the form when this changes — never on every input tick.
   * Reading the current model value inside `untracked()` keeps it
   * out of the reactive graph so writing to it doesn't re-trigger
   * the effect (which would loop forever under OnPush).
   */
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
