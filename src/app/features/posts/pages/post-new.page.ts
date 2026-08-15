import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { AuthStore } from '@features/auth/auth.store';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { PostsApi } from '../posts.api';
import { PostsQueryState } from '../posts.query-state';

interface PostFormModel {
  title: string;
  body: string;
  tags: string;
}

/**
 * /posts/new — standalone page that creates a post owned by the
 * current user.
 *
 * Uses Signal Forms so the submit button can be driven by a
 * `canSubmit` computed.
 */
@Component({
  selector: 'app-post-new-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, TranslocoModule, IconComponent],
  templateUrl: './post-new.page.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class PostNewPage {
  private readonly auth = inject(AuthStore);
  private readonly api = inject(PostsApi);
  private readonly router = inject(Router);
  private readonly queryState = inject(PostsQueryState);

  protected readonly postModel = signal<PostFormModel>({ title: '', body: '', tags: '' });
  protected readonly form = form(this.postModel, (p) => {
    required(p.title);
    minLength(p.title, 3);
    required(p.body);
    minLength(p.body, 10);
  });

  protected readonly canSubmit = computed(() => this.form().valid() && this.auth.isAuthenticated());

  protected onCancel(): void {
    void this.router.navigateByUrl('/posts');
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.form().valid()) {
      this.form().markAsTouched();
      return;
    }
    const userId = this.auth.user()?.id;
    if (!userId) {
      return;
    }
    const { title, body, tags } = this.postModel();
    const tagList = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    void this.api
      .create({
        userId,
        title,
        body,
        tags: tagList,
        // json-server v1-beta does not stamp `createdAt` on POST, so
        // the client provides it. Mirrors the comments model.
        createdAt: new Date().toISOString(),
      })
      .then((created) => {
        // Invalidate the list cache so the new post shows up the next
        // time the list page is rendered (e.g. after navigating back
        // from the detail view).
        this.queryState.bumpRefresh();
        void this.router.navigate(['/posts', created.id]);
      });
  }
}
