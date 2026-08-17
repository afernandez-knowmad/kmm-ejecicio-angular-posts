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

import { AuthStore } from '@features/auth/auth.store';
import { isOwner, toId } from '@core/lib/ids';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { UsersStore } from '@features/posts/users.store';
import { CommentEditFormComponent } from './comment-edit-form.component';
import { CommentsApi } from '../comments.api';
import { formatRelativeTime } from '../lib/relative-time';
import type { Comment } from '../models/comment.model';

/**
 * Componente presentacional de una fila de comentario.
 *
 * Resuelve el autor desde UsersStore.byId, solo muestra
 * editar/borrar cuando el comentario es del usuario actual y
 * alterna un formulario de edición inline.
 */
@Component({
  selector: 'app-comment-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, CommentEditFormComponent, IconComponent],
  host: { class: 'block' },
  template: `
    <article class="flex flex-col gap-2 sm:gap-1" data-testid="comment-item">
      <header class="flex items-start justify-between gap-3">
        <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0 leading-tight">
          <strong class="text-sm font-semibold text-slate-900">{{ authorName() }}</strong>
          <time
            class="text-xs italic text-slate-400"
            [attr.datetime]="comment().createdAt"
            data-testid="comment-date"
          >
            {{ formattedDate() }}
          </time>
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

  // Pinta el bucket relativo + la hora absoluta, separados por coma:
  // "Hoy, 10:01" / "Ayer, 09:30" / "12/2/2026, 10:01".
  //
  // json-server a veces no asigna `createdAt` en comentarios creados
  // por POST, así que si el backend lo deja vacío caemos al reloj
  // local. Si no, la fila saldría sin fecha.
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
