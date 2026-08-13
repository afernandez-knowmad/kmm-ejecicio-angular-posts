import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { IconComponent } from '../../../shared/ui/icon/icon.component';
import { AuthStore } from '../auth.store';

/**
 * Header logout button with icon and label.
 *
 * Renders nothing when there is no active session so it can sit
 * unconditionally in the app shell.
 */
@Component({
  selector: 'app-logout-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, IconComponent],
  template: `
    @if (store.isAuthenticated()) {
      <button
        type="button"
        [attr.aria-label]="'nav.logout' | transloco"
        class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100"
        (click)="onLogout()"
        data-testid="logout-button"
      >
        <app-icon name="logout" [size]="18" />
        {{ 'nav.logout' | transloco }}
      </button>
    }
  `,
})
export class LogoutButtonComponent {
  protected readonly store = inject(AuthStore);
  private readonly router = inject(Router);

  protected onLogout(): void {
    this.store.logout();
    void this.router.navigateByUrl('/login');
  }
}
