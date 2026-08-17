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

  // Vista reactiva de la URL actual (post-redirect). Emite el valor
  // inicial de forma síncrona para que el header pinte bien al primer
  // render y se actualiza en cada navegación exitosa.
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  // Solo true en la lista de posts (`/posts`, con o sin query params).
  // Se excluyen `/posts/:id`, `/posts/:id/edit` y `/posts/new` para
  // que la búsqueda del header no aparezca ahí.
  //
  // Comparamos contra los segmentos del UrlTree y no contra el string
  // de la URL: así `/posts/123` se reconoce como detalle aunque
  // comparta prefijo con la lista.
  protected readonly isPostsList = computed(() => {
    const tree = this.router.parseUrl(this.currentUrl());
    const segments = tree.root.children['primary']?.segments ?? [];
    return segments.length === 1 && segments[0].path === 'posts';
  });

  // El buscador del header solo sale si hay sesión y estamos en la
  // lista de posts.
  protected readonly showSearch = computed(
    () => this.store.isAuthenticated() && this.isPostsList(),
  );
}
