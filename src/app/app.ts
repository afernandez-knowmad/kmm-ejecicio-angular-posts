import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { filter, map, startWith } from 'rxjs/operators';

import { LogoutButtonComponent } from '@features/auth/components/logout-button.component';
import { LangSwitcherComponent } from '@features/i18n/lang-switcher.component';
import { PostsSearchComponent } from '@features/posts/components/posts-search.component';
import { AuthStore } from '@features/auth/auth.store';

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
  private readonly router = inject(Router);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  // Comparamos contra segmentos del UrlTree y no contra el string
  // de la URL: así `/posts/123` se reconoce como detalle aunque
  // comparta prefijo con la lista.
  protected readonly isPostsList = computed(() => {
    const tree = this.router.parseUrl(this.currentUrl());
    const segments = tree.root.children['primary']?.segments ?? [];
    return segments.length === 1 && segments[0].path === 'posts';
  });

  protected readonly showSearch = computed(
    () => this.store.isAuthenticated() && this.isPostsList(),
  );
}
