import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { DEFAULT_LANG, SUPPORTED_LANGS, type SupportedLang } from './transloco.config';

/**
 * Minimal language switcher used in the app header.
 *
 * Implementation lives here (rather than in `shared/ui`) because it is
 * tightly coupled to Transloco. The component is presentational: it
 * reads the active language from TranslocoService and emits the change
 * back to it.
 */
@Component({
  selector: 'app-lang-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label class="lang-switcher" [attr.aria-label]="'lang.label' | transloco">
      <span class="lang-switcher__label">{{ 'lang.label' | transloco }}</span>
      <select class="lang-switcher__select" [value]="active()" (change)="onChange($event)">
        @for (lang of langs; track lang) {
          <option [value]="lang">{{ 'lang.' + lang | transloco }}</option>
        }
      </select>
    </label>
  `,
  styles: [
    `
      .lang-switcher {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
      }
      .lang-switcher__select {
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;
        border: 1px solid rgba(0, 0, 0, 0.15);
        background: transparent;
      }
    `,
  ],
  imports: [TranslocoModule],
})
export class LangSwitcherComponent {
  private readonly transloco = inject(TranslocoService);

  protected readonly langs = SUPPORTED_LANGS;
  private readonly langEvents = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });
  protected readonly active = computed<SupportedLang>(() => {
    const current = this.langEvents();
    return (SUPPORTED_LANGS as readonly string[]).includes(current)
      ? (current as SupportedLang)
      : DEFAULT_LANG;
  });

  protected onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as SupportedLang;
    this.transloco.setActiveLang(value);
  }
}
