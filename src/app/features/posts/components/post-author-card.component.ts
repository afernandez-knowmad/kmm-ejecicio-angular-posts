import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

import { toId } from '@core/lib/ids';
import { AvatarComponent } from '@shared/ui/avatar.component';
import { UsersStore } from '../users.store';

@Component({
  selector: 'app-post-author-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, AvatarComponent],
  host: { class: 'inline-flex' },
  template: `
    <aside class="inline-flex items-center gap-2" data-testid="post-author-card">
      <app-avatar [name]="authorName()" [size]="28" />
      <div class="flex flex-col leading-tight">
        <span class="text-xs text-slate-500">{{ 'posts.detail.by' | transloco }}</span>
        <strong class="text-sm font-semibold text-slate-900">{{ authorName() }}</strong>
      </div>
    </aside>
  `,
})
export class PostAuthorCardComponent {
  private readonly usersStore = inject(UsersStore);

  readonly userId = input.required<string>();

  protected readonly authorName = computed(() => {
    const id = toId(this.userId());
    const user = this.usersStore.byId().get(id);
    return user?.name ?? `#${id}`;
  });

  constructor() {
    void this.usersStore.ensureLoaded();
  }
}
