import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';

// Sufijo que se añade a cada título de página. Hard-codeado para
// que la estrategia no dependa del catálogo de i18n.
const APP_TITLE = 'TechPoC';

@Injectable({ providedIn: 'root' })
export class TranslocoTitleStrategy extends TitleStrategy {
  private readonly transloco = inject(TranslocoService);
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const rawKey = this.buildTitle(snapshot) ?? APP_TITLE;
    const translated = this.transloco.translate(rawKey);

    const isMissing = translated === rawKey && rawKey.includes('.');
    const label = isMissing ? rawKey : translated;
    this.title.setTitle(`${label} | ${APP_TITLE}`);
  }
}
