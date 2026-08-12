import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { AuthStore } from '../../auth/auth.store';
import { isOwner } from '../../../core/lib/ids';

/**
 * Edit / delete actions for a post.
 *
 * Renders nothing when the current user is not the post author. The
 * delete button emits a `delete` output so the parent page can
 * perform the actual API call and navigation.
 */
@Component({
  selector: 'app-post-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, RouterLink],
  template: `
    @if (canEdit()) {
      <div class="post-actions" data-testid="post-actions">
        <a
          class="post-actions__btn post-actions__btn--edit"
          [routerLink]="['/posts', postId(), 'edit']"
          data-testid="post-edit-link"
        >
          {{ 'posts.detail.edit' | transloco }}
        </a>
        <button
          type="button"
          class="post-actions__btn post-actions__btn--delete"
          (click)="onDelete()"
          data-testid="post-delete-button"
        >
          {{ 'posts.detail.delete' | transloco }}
        </button>
      </div>
    }
  `,
  styles: [
    `
      .post-actions {
        display: flex;
        gap: 0.5rem;
      }
      .post-actions__btn {
        padding: 0.375rem 0.75rem;
        border-radius: 0.375rem;
        border: 1px solid rgba(0, 0, 0, 0.2);
        background: transparent;
        font-size: 0.875rem;
        cursor: pointer;
        text-decoration: none;
        color: inherit;
      }
      .post-actions__btn--edit:hover {
        background: rgba(37, 99, 235, 0.08);
      }
      .post-actions__btn--delete:hover {
        background: rgba(192, 57, 43, 0.08);
        color: #c0392b;
      }
    `,
  ],
})
export class PostActionsComponent {
  private readonly auth = inject(AuthStore);

  readonly postId = input.required<string>();
  readonly userId = input.required<string>();

  readonly delete = output<void>();

  protected readonly canEdit = computed(() => isOwner(this.userId(), this.auth.user()?.id));

  protected onDelete(): void {
    this.delete.emit();
  }
}
