import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { AuthStore } from '../../auth/auth.store';
import { PostsApi } from '../posts.api';

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
  imports: [FormField, TranslocoModule],
  templateUrl: './post-new.page.html',
  styleUrl: './post-new.page.css',
})
export class PostNewPage {
  private readonly auth = inject(AuthStore);
  private readonly api = inject(PostsApi);
  private readonly router = inject(Router);

  protected readonly postModel = signal<PostFormModel>({ title: '', body: '', tags: '' });
  protected readonly form = form(this.postModel, (p) => {
    required(p.title);
    minLength(p.title, 3);
    required(p.body);
    minLength(p.body, 10);
  });

  protected readonly canSubmit = computed(() => this.form().valid() && this.auth.isAuthenticated());

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
      .create({ userId, title, body, tags: tagList })
      .then((created) => this.router.navigate(['/posts', created.id]));
  }
}
