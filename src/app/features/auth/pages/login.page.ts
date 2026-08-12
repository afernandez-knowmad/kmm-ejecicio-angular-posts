import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { AuthStore } from '../auth.store';

/**
 * Standalone login page.
 *
 * Uses ReactiveForms with `nonNullable` controls so we can keep a
 * Signal-based view of the form via `toSignal(valueChanges)`. When
 * `@angular/forms/signals` stabilises this can be migrated to
 * `signal()`-backed fields without changing the public surface.
 */
@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslocoModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  protected readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    password: ['', [Validators.required, Validators.minLength(4)]],
  });

  private readonly status = toSignal(this.form.statusChanges, {
    initialValue: 'PENDING' as 'PENDING' | 'VALID' | 'INVALID',
  });
  protected readonly canSubmit = computed(() => this.status() === 'VALID' && !this.store.loading());

  protected readonly errorMessage = computed(() => {
    const err = this.store.error();
    return err ? `auth.errors.${err}` : null;
  });

  protected onSubmit(): void {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, password } = this.form.getRawValue();
    void this.store.login({ name, password }).then(() => this.navigateAfterLogin());
  }

  private navigateAfterLogin(): void {
    const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') ?? '/posts';
    void this.router.navigateByUrl(redirectTo);
  }
}
