import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { AuthStore } from '../auth.store';
import { ErrorStateComponent } from '../../../shared/ui/error-state.component';
import { IconComponent } from '../../../shared/ui/icon/icon.component';

interface LoginModel {
  name: string;
  password: string;
}

/**
 * Standalone login page.
 *
 * Built on `@angular/forms/signals` (Angular v22). The form is declared
 * with `form(model, schema(...))`; the schema applies `required` and
 * `minLength` validators to each field path. Each control is bound to
 * an `<input>` via the `FormField` directive (`[formField]`).
 */
@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, TranslocoModule, ErrorStateComponent, IconComponent],
  templateUrl: './login.page.html',
  styles: [
    `
      :host {
        display: block;
      }

      form :where(input) {
        background-color: #f3f3f3;
      }
    `,
  ],
})
export class LoginPage {
  protected readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly loginModel = signal<LoginModel>({ name: '', password: '' });
  protected readonly form = form(this.loginModel, (p) => {
    required(p.name);
    minLength(p.name, 2);
    required(p.password);
    minLength(p.password, 4);
  });

  protected readonly canSubmit = computed(() => this.form().valid() && !this.store.loading());

  protected readonly errorMessage = computed(() => {
    const err = this.store.error();
    return err ? `auth.errors.${err}` : null;
  });

  /** Flips to true on first submit attempt; used to gate field error rendering. */
  private readonly submitAttempted = signal(false);

  protected readonly showNameError = computed(
    () => this.submitAttempted() && this.form.name().errors().length > 0,
  );
  protected readonly showPasswordError = computed(
    () => this.submitAttempted() && this.form.password().errors().length > 0,
  );

  protected onSubmit(event?: Event): void {
    event?.preventDefault();
    if (!this.form().valid()) {
      this.submitAttempted.set(true);
      return;
    }
    const { name, password } = this.loginModel();
    void this.store.login({ name, password }).then(() => this.navigateAfterLogin());
  }

  private navigateAfterLogin(): void {
    const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') ?? '/posts';
    void this.router.navigateByUrl(redirectTo);
  }
}
