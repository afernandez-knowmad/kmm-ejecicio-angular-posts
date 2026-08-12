import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { AuthStore } from '../../auth/auth.store';
import { PostsApi } from '../posts.api';

/**
 * /posts/new — standalone page that creates a post owned by the
 * current user.
 *
 * Uses ReactiveForms with nonNullable controls + sync validators so
 * the submit button can be driven by a `canSubmit` computed.
 */
@Component({
  selector: 'app-post-new-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslocoModule],
  templateUrl: './post-new.page.html',
  styleUrl: './post-new.page.css',
})
export class PostNewPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthStore);
  private readonly api = inject(PostsApi);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    body: ['', [Validators.required, Validators.minLength(10)]],
    tags: [''],
  });

  private readonly status = toSignal(this.form.statusChanges, {
    initialValue: 'PENDING' as 'PENDING' | 'VALID' | 'INVALID',
  });
  protected readonly canSubmit = computed(
    () => this.status() === 'VALID' && this.auth.isAuthenticated(),
  );

  protected onSubmit(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    const userId = this.auth.user()?.id;
    if (!userId) {
      return;
    }
    const { title, body, tags } = this.form.getRawValue();
    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    void this.api
      .create({ userId, title, body, tags: tagList })
      .then((created) => this.router.navigate(['/posts', created.id]));
  }
}
