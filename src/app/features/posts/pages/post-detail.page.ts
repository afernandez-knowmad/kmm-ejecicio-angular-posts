import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Title } from '@angular/platform-browser';

import { API_BASE_URL } from '@core/http/api-base-url.token';
import { toId } from '@core/lib/ids';
import { EmptyStateComponent } from '@shared/ui/empty-state.component';
import { ErrorStateComponent } from '@shared/ui/error-state.component';
import { ForbiddenStateComponent } from '@shared/ui/forbidden-state.component';
import { LoadingStateComponent } from '@shared/ui/loading-state.component';
import { PostActionsComponent } from '../components/post-actions.component';
import type { Post } from '../models/post.model';
import { PostsApi } from '../posts.api';
import { PostsQueryState } from '../posts.query-state';
import { UsersStore } from '../users.store';
import { CommentsSectionComponent } from '@features/comments/components/comments-section.component';

@Component({
  selector: 'app-post-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    PostActionsComponent,
    CommentsSectionComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    ForbiddenStateComponent,
  ],
  templateUrl: './post-detail.page.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class PostDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = inject(PostsApi);
  private readonly queryState = inject(PostsQueryState);
  private readonly transloco = inject(TranslocoService);
  private readonly title = inject(Title);
  protected readonly usersStore = inject(UsersStore);

  private readonly idParam = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly postId = computed(() => toId(this.idParam().get('id')));

  protected readonly forbidden = computed(
    () => this.route.snapshot.queryParamMap.get('forbidden') === '1',
  );

  protected readonly postResource = httpResource<Post>(() => ({
    url: `${this.baseUrl}/posts/${this.postId()}`,
  }));

  protected readonly status = computed(() => {
    if (this.forbidden()) {
      return 'forbidden' as const;
    }
    const r = this.postResource;
    if (r.status() === 'loading' || r.status() === 'reloading') {
      return 'loading' as const;
    }
    if (r.status() === 'error') {
      return 'error' as const;
    }
    const value = r.value();
    if (value === undefined) {
      return 'not-found' as const;
    }
    return 'resolved' as const;
  });

  protected onDelete(): void {
    const id = this.postId();
    if (
      typeof window !== 'undefined' &&
      !window.confirm(this.transloco.translate('posts.detail.deleteConfirm'))
    ) {
      return;
    }
    void this.api.delete(id).then(() => {
      this.queryState.bumpRefresh();
      void this.router.navigateByUrl('/posts');
    });
  }

  protected readonly post = computed<Post | undefined>(() => this.postResource.value());

  constructor() {
    effect(() => {
      const p = this.post();
      if (!p) {
        return;
      }
      const prefix = this.transloco.translate('posts.detail.title');
      this.title.setTitle(`${prefix} · ${p.title} | TechPoC`);
    });
  }
}
