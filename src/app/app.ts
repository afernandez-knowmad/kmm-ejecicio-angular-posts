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

  /**
   * Reactive view of the current URL (post-redirect). Emits the
   * initial value synchronously so the header renders correctly on
   * the very first paint, and updates on every successful navigation.
   */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /**
   * True only when the active route is the posts list
   * (`/posts`, with optional query params). Detail (`/posts/:id`),
   * edit (`/posts/:id/edit`) and new (`/posts/new`) sub-routes are
   * excluded so the header search input never appears there.
   *
   * We match against the UrlTree segments rather than the URL
   * string so that, e.g., `/posts/123` is correctly recognised as
   * the detail route even though it shares the `/posts` prefix.
   */
  protected readonly isPostsList = computed(() => {
    const tree = this.router.parseUrl(this.currentUrl());
    const segments = tree.root.children['primary']?.segments ?? [];
    return segments.length === 1 && segments[0].path === 'posts';
  });

  /**
   * The header search box should only render for authenticated
   * users AND while they are on the posts list page.
   */
  protected readonly showSearch = computed(
    () => this.store.isAuthenticated() && this.isPostsList(),
  );
}
