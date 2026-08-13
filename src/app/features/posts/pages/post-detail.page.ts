import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { API_BASE_URL } from '../../../core/http/api-base-url.token';
import { toId } from '../../../core/lib/ids';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { ForbiddenStateComponent } from '../../../shared/ui/forbidden-state.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { CommentsSectionComponent } from '../../comments/components/comments-section.component';
import { PostActionsComponent } from '../components/post-actions.component';
import { PostAuthorCardComponent } from '../components/post-author-card.component';
import type { Post } from '../models/post.model';
import { PostsApi } from '../posts.api';
import { UsersStore } from '../users.store';

/**
 * Post detail page.
 *
 * Reads the :id route param, fetches the post via httpResource, and
 * surfaces loading/error/not-found states explicitly. The `forbidden`
 * query param short-circuits the render to a forbidden state when the
 * user was redirected from the ownership guard.
 */
@Component({
  selector: 'app-post-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoModule,
    PostAuthorCardComponent,
    PostActionsComponent,
    CommentsSectionComponent,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    ForbiddenStateComponent,
  ],
  templateUrl: './post-detail.page.html',
  styleUrl: './post-detail.page.css',
})
export class PostDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly api = inject(PostsApi);
  private readonly transloco = inject(TranslocoService);
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
    void this.api.delete(id).then(() => this.router.navigateByUrl('/posts'));
  }

  protected readonly post = computed<Post | undefined>(() => this.postResource.value());
}
