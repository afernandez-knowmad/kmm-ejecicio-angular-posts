import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';

import { CommentsApi } from '../comments.api';
import type { Comment } from '../models/comment.model';

/**
 * Inline edit form for a comment. Seeds its value from the input
 * comment via effect() and emits 'saved' on submit.
 */
@Component({
  selector: 'app-comment-edit-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslocoModule],
  template: `
    <form class="comment-edit-form" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
      <textarea
        class="comment-edit-form__input"
        rows="3"
        formControlName="body"
        data-testid="comment-edit-input"
      ></textarea>
      <div class="comment-edit-form__actions">
        <button
          type="submit"
          class="comment-edit-form__btn"
          [disabled]="form.invalid || submitting()"
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
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(CommentsApi);

  readonly postId = input.required<string>();
  readonly comment = input.required<Comment>();

  readonly saved = output<Comment>();
  readonly cancelled = output<void>();

  protected readonly form = this.fb.nonNullable.group({
    body: ['', [Validators.required, Validators.minLength(2)]],
  });

  protected readonly submitting = signal(false);

  constructor() {
    effect(() => {
      const c = this.comment();
      // Seed once per comment change.
      if (this.form.controls.body.value !== c.body) {
        this.form.patchValue({ body: c.body });
      }
    });
  }

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const body = this.form.controls.body.getRawValue().trim();
    if (body.length === 0) {
      return;
    }
    this.submitting.set(true);
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
