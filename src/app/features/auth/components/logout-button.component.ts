import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { AuthStore } from '../auth.store';

/**
 * Header button that clears the session and redirects to /login.
 *
 * Renders nothing when there is no active session so it can sit
 * unconditionally in the app shell.
 */
@Component({
  selector: 'app-logout-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule],
  template: `
    @if (store.isAuthenticated()) {
      <button type="button" class="logout-button" (click)="onLogout()" data-testid="logout-button">
        {{ 'nav.logout' | transloco }}
      </button>
    }
  `,
  styles: [
    `
      .logout-button {
        background: transparent;
        border: 1px solid rgba(0, 0, 0, 0.2);
        border-radius: 0.375rem;
        padding: 0.25rem 0.625rem;
        font-size: 0.875rem;
        cursor: pointer;
      }
      .logout-button:hover {
        background: rgba(0, 0, 0, 0.04);
      }
    `,
  ],
})
export class LogoutButtonComponent {
  protected readonly store = inject(AuthStore);
  private readonly router = inject(Router);

  protected onLogout(): void {
    this.store.logout();
    void this.router.navigateByUrl('/login');
  }
}
