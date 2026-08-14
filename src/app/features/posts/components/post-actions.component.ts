import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { AuthStore } from '@features/auth/auth.store';
import { isOwner } from '@core/lib/ids';
import { IconComponent } from '@shared/ui/icon/icon.component';

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
  imports: [TranslocoModule, RouterLink, IconComponent],
  host: { class: 'inline-flex' },
  template: `
    @if (canEdit()) {
      <div class="flex items-center gap-3" data-testid="post-actions">
        <a
          class="inline-flex h-[38px] items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          [routerLink]="['/posts', postId(), 'edit']"
          data-testid="post-edit-link"
        >
          <app-icon class="text-white" name="edit" [size]="16" />
          <span class="text-white">{{ 'posts.detail.edit' | transloco }}</span>
        </a>
        <button
          type="button"
          class="inline-flex h-[38px] items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
          (click)="onDelete()"
          data-testid="post-delete-button"
        >
          <app-icon name="trash" [size]="16" />
          <span>{{ 'posts.detail.delete' | transloco }}</span>
        </button>
      </div>
    }
  `,
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
