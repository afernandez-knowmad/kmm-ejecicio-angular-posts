import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { IconComponent } from '@shared/ui/icon/icon.component';
import { AuthStore } from '../auth.store';

@Component({
  selector: 'app-logout-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, IconComponent],
  template: `
    @if (store.isAuthenticated()) {
      <button
        type="button"
        [attr.aria-label]="'nav.logout' | transloco"
        class="inline-flex w-auto px-2 h-9 items-center gap-2 justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100"
        (click)="onLogout()"
        data-testid="logout-button"
      >
        <app-icon name="logout" [size]="18" />
        <span>{{ 'nav.logout' | transloco }}</span>
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
