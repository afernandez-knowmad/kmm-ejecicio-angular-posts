import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';

import { LogoutButtonComponent } from './features/auth/components/logout-button.component';
import { LangSwitcherComponent } from './features/i18n/lang-switcher.component';
import { PostsSearchComponent } from './features/posts/components/posts-search.component';
import { AuthStore } from './features/auth/auth.store';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    TranslocoModule,
    LangSwitcherComponent,
    LogoutButtonComponent,
    PostsSearchComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly store = inject(AuthStore);
}
