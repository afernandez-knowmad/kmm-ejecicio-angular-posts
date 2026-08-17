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

import { API_BASE_URL } from '@core/http/api-base-url.token';
import { toId } from '@core/lib/ids';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { PostsApi } from '../posts.api';
import { PostsQueryState } from '../posts.query-state';
import type { Post } from '../models/post.model';

interface PostFormModel {
  title: string;
  body: string;
  tags: string;
}

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
  private readonly queryState = inject(PostsQueryState);

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

  private readonly submitAttempted = signal(false);

  protected readonly titleField = computed(() => this.form.title());
  protected readonly bodyField = computed(() => this.form.body());

  protected readonly showTitleError = computed(
    () => this.submitAttempted() && this.titleField().errors().length > 0,
  );
  protected readonly showBodyError = computed(
    () => this.submitAttempted() && this.bodyField().errors().length > 0,
  );

  // Orden required → minLength para que el primer fallo sea el que
  // sale al lector de pantalla.
  protected readonly titleErrorKind = computed(() => {
    const errors = this.titleField().errors();
    if (errors.length === 0) {
      return null;
    }
    if (errors.some((e) => e.kind === 'required')) {
      return 'required' as const;
    }
    if (errors.some((e) => e.kind === 'minLength')) {
      return 'minLength' as const;
    }
    return errors[0].kind;
  });

  protected readonly titleErrorKey = computed(() => {
    const kind = this.titleErrorKind();
    if (kind === null) {
      return null;
    }
    if (kind === 'minLength') {
      return 'posts.form.errors.minlength';
    }
    return 'posts.form.errors.required';
  });

  protected readonly titleErrorParams = computed(() => {
    const kind = this.titleErrorKind();
    if (kind === 'minLength') {
      return { min: 3, actual: this.postModel().title.length };
    }
    return {};
  });

  protected readonly bodyErrorKind = computed(() => {
    const errors = this.bodyField().errors();
    if (errors.length === 0) {
      return null;
    }
    if (errors.some((e) => e.kind === 'required')) {
      return 'required' as const;
    }
    if (errors.some((e) => e.kind === 'minLength')) {
      return 'minLength' as const;
    }
    return errors[0].kind;
  });

  protected readonly bodyErrorKey = computed(() => {
    const kind = this.bodyErrorKind();
    if (kind === null) {
      return null;
    }
    if (kind === 'minLength') {
      return 'posts.form.errors.minlength';
    }
    return 'posts.form.errors.required';
  });

  protected readonly bodyErrorParams = computed(() => {
    const kind = this.bodyErrorKind();
    if (kind === 'minLength') {
      return { min: 10, actual: this.postModel().body.length };
    }
    return {};
  });

  protected onCancel(): void {
    void this.router.navigate(['/posts', this.postId()]);
  }

  private lastSeededPost: Post | undefined;

  constructor() {
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
      this.submitAttempted.set(true);
      this.form().markAsTouched();
      return;
    }
    const { title, body, tags } = this.postModel();
    const tagList = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    void this.api.update(this.postId(), { title, body, tags: tagList }).then(() => {
      this.queryState.bumpRefresh();
      void this.router.navigate(['/posts', this.postId()]);
    });
  }
}
