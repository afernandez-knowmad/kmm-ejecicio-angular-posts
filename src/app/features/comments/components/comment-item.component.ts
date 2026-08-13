import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { AuthStore } from '../../auth/auth.store';
import { isOwner, toId } from '../../../core/lib/ids';
import { AvatarComponent } from '../../../shared/ui/avatar.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { UsersStore } from '../../posts/users.store';
import { CommentEditFormComponent } from './comment-edit-form.component';
import { CommentsApi } from '../comments.api';
import { formatRelativeTime } from '../lib/relative-time';
import type { Comment } from '../models/comment.model';

/**
 * Presentational component for a single comment row.
 *
 * Resolves the author from UsersStore.byId, renders edit/delete
 * actions only when the current user owns the comment, and toggles
 * an inline edit form when the user opts to edit.
 */
@Component({
  selector: 'app-comment-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, CommentEditFormComponent, AvatarComponent, IconComponent],
  host: { class: 'block' },
  template: `
    <article class="flex flex-col gap-2" data-testid="comment-item">
      <header class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-2">
          <app-avatar [name]="authorName()" [size]="28" />
          <div class="flex flex-col leading-tight">
            <strong class="text-sm font-semibold text-slate-900">{{ authorName() }}</strong>
            <time
              class="text-xs text-slate-400"
              [attr.datetime]="comment().createdAt"
              data-testid="comment-date"
            >
              {{ formattedDate() }}
            </time>
          </div>
        </div>

        @if (canEdit() && !editing()) {
          <div class="flex items-center gap-1" data-testid="comment-actions">
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand-600"
              (click)="startEdit()"
              [attr.aria-label]="'comments.actions.edit' | transloco"
              data-testid="comment-edit-button"
            >
              <app-icon name="edit" [size]="14" />
            </button>
            <button
              type="button"
              class="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
              (click)="onDelete()"
              [attr.aria-label]="'comments.actions.delete' | transloco"
              data-testid="comment-delete-button"
            >
              <app-icon name="trash" [size]="14" />
            </button>
          </div>
        }
      </header>

      @if (editing()) {
        <app-comment-edit-form
          [postId]="postId()"
          [comment]="comment()"
          (saved)="onSaved($event)"
          (cancelled)="onCancel()"
        />
      } @else {
        <p class="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
          {{ comment().body }}
        </p>
      }
    </article>
  `,
})
export class CommentItemComponent {
  private readonly auth = inject(AuthStore);
  private readonly usersStore = inject(UsersStore);
  private readonly api = inject(CommentsApi);
  private readonly transloco = inject(TranslocoService);

  readonly postId = input.required<string>();
  readonly comment = input.required<Comment>();

  readonly updated = output<Comment>();
  readonly deleted = output<{ id: string }>();

  protected readonly editing = signal(false);

  protected readonly canEdit = computed(() => isOwner(this.comment().userId, this.auth.user()?.id));

  protected readonly authorName = computed(() => {
    const id = toId(this.comment().userId);
    const user = this.usersStore.byId().get(id);
    return user?.name ?? `#${id}`;
  });

  private readonly lang = computed(() => this.transloco.getActiveLang());

  /**
   * Display the relative bucket + absolute time, separated by a
   * comma: "Hoy, 10:01" / "Ayer, 09:30" / "12/2/2026, 10:01".
   *
   * json-server does not always assign `createdAt` to comments
   * created via POST, so we fall back to the local clock when the
   * backend left it empty. Otherwise the row would render with no
   * date at all.
   */
  protected readonly formattedDate = computed(() => {
    const iso = this.comment().createdAt || new Date().toISOString();
    const { label, time } = formatRelativeTime(iso, new Date(), this.lang());
    if (!label) {
      return '';
    }
    return time ? `${label}, ${time}` : label;
  });

  constructor() {
    void this.usersStore.ensureLoaded();
  }

  protected startEdit(): void {
    this.editing.set(true);
  }

  protected onSaved(comment: Comment): void {
    this.editing.set(false);
    this.updated.emit(comment);
  }

  protected onCancel(): void {
    this.editing.set(false);
  }

  protected async onDelete(): Promise<void> {
    const id = this.comment().id;
    await this.api.delete(id);
    this.deleted.emit({ id });
  }
}
