import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { API_BASE_URL } from '../../../core/http/api-base-url.token';
import { toId } from '../../../core/lib/ids';
import { PostsApi } from '../posts.api';
import type { Post } from '../models/post.model';

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
  imports: [ReactiveFormsModule, TranslocoModule],
  templateUrl: './post-edit.page.html',
  styleUrl: './post-edit.page.css',
})
export class PostEditPage {
  private readonly fb = inject(FormBuilder);
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

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    body: ['', [Validators.required, Validators.minLength(10)]],
    tags: [''],
  });

  private readonly status = toSignal(this.form.statusChanges, {
    initialValue: 'PENDING' as 'PENDING' | 'VALID' | 'INVALID',
  });
  protected readonly canSubmit = computed(() => this.status() === 'VALID');

  constructor() {
    // Seed the form once the resource resolves.
    effect(() => {
      const p = this.postResource.value();
      if (p) {
        this.form.patchValue({
          title: p.title,
          body: p.body,
          tags: p.tags.join(', '),
        });
      }
    });
  }

  protected onSubmit(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    const { title, body, tags } = this.form.getRawValue();
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    void this.api
      .update(this.postId(), { title, body, tags: tagList })
      .then(() => this.router.navigate(['/posts', this.postId()]));
  }
}
