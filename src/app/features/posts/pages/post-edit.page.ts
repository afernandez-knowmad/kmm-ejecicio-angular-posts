import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { API_BASE_URL } from '../../../core/http/api-base-url.token';
import { toId } from '../../../core/lib/ids';
import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { PostsApi } from '../posts.api';
import type { Post } from '../models/post.model';

interface PostFormModel {
  title: string;
  body: string;
  tags: string;
}

/**
 * /posts/:id/edit — standalone page that updates a post.
 *
 * Loads the post with httpResource and pre-fills the form once the
 * resource resolves. On submit, calls PostsApi.update and navigates
 * back to the detail page.
 */
@Component({
  selector: 'app-post-edit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, TranslocoModule, IconComponent],
  templateUrl: './post-edit.page.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class PostEditPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(PostsApi);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly idParam = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  protected readonly postId = computed(() => toId(this.idParam().get('id')));

  protected readonly postResource = httpResource<Post>(() => ({
    url: `${this.baseUrl}/posts/${this.postId()}`,
  }));

  protected readonly postModel = signal<PostFormModel>({ title: '', body: '', tags: '' });
  protected readonly form = form(this.postModel, (p) => {
    required(p.title);
    minLength(p.title, 3);
    required(p.body);
    minLength(p.body, 10);
  });
  protected readonly canSubmit = computed(() => this.form().valid());

  protected onCancel(): void {
    void this.router.navigate(['/posts', this.postId()]);
  }

  private lastSeededPost: Post | undefined;

  constructor() {
    // Seed the form once the resource resolves. Only re-seed when the
    // resource value changes, so unrelated signal effects cannot
    // overwrite edits made by the user.
    effect(() => {
      const p = this.postResource.value();
      if (p && p !== this.lastSeededPost) {
        this.lastSeededPost = p;
        this.postModel.set({
          title: p.title,
          body: p.body,
          tags: p.tags.join(', '),
        });
      }
    });
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.form().valid()) {
      this.form().markAsTouched();
      return;
    }
    const { title, body, tags } = this.postModel();
    const tagList = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    void this.api
      .update(this.postId(), { title, body, tags: tagList })
      .then(() => this.router.navigate(['/posts', this.postId()]));
  }
}
