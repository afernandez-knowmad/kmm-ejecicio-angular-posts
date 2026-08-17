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
    void this.router.navigateByUrl('/posts');
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.form().valid()) {
      this.submitAttempted.set(true);
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
        // json-server v1-beta no estampa `createdAt` en el POST.
        createdAt: new Date().toISOString(),
      })
      .then((created) => {
        this.queryState.bumpRefresh();
        void this.router.navigate(['/posts', created.id]);
      });
  }
}
