import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';

/**
 * Suffix appended to every page title, separated by ` | `.
 *
 * Hard-coded so the strategy is independent of the i18n catalogue.
 * Keeping it short keeps the browser tab legible on mobile.
 */
const APP_TITLE = 'TechPoC';

/**
 * Custom router title strategy.
 *
 * Translates the route's `title` field through Transloco and appends
 * the app name. The router invokes `updateTitle` after a successful
 * navigation, so by then the correct i18n catalogue is loaded.
 *
 * The route's `title` is interpreted as a Transloco key (e.g.
 * `posts.list.title`) rather than a literal string. If the key is
 * missing we fall back to the raw value so the tab is never blank.
 *
 * Detail pages may overwrite the title later (e.g. once the post
 * title is known). This is done by calling `Title.setTitle` directly
 * from the page, which takes precedence over the strategy.
 */
@Injectable({ providedIn: 'root' })
export class TranslocoTitleStrategy extends TitleStrategy {
  private readonly transloco = inject(TranslocoService);
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const rawKey = this.buildTitle(snapshot) ?? APP_TITLE;
    const translated = this.transloco.translate(rawKey);
    // Transloco returns the key itself when the key is missing; only
    // treat the *translated* value as "real" when it differs from the
    // key. Otherwise keep the raw key so the layout still renders
    // something visible while translations are pre-loading.
    const isMissing = translated === rawKey && rawKey.includes('.');
    const label = isMissing ? rawKey : translated;
    this.title.setTitle(`${label} | ${APP_TITLE}`);
  }
}
