import { Component, computed, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { LogoutButtonComponent } from './features/auth/components/logout-button.component';
import { LangSwitcherComponent } from './features/i18n/lang-switcher.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    TranslocoModule,
    LangSwitcherComponent,
    LogoutButtonComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly now = signal(new Date());
  protected readonly year = computed(() => this.now().getFullYear());
}
