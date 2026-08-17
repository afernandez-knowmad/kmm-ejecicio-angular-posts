import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { DEFAULT_LANG, SUPPORTED_LANGS, type SupportedLang } from './transloco.config';

@Component({
  selector: 'app-lang-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="inline-flex items-center rounded-full bg-slate-100 p-1 text-xs font-semibold tracking-wide text-slate-700"
      role="group"
      [attr.aria-label]="'lang.label' | transloco"
    >
      @for (lang of langs; track lang) {
        <button
          type="button"
          class="rounded-full px-3 py-1 leading-none transition-colors uppercase"
          [class.bg-brand-600]="active() === lang"
          [class.text-white]="active() === lang"
          [class.shadow-sm]="active() === lang"
          (click)="setLang(lang)"
        >
          {{ lang }}
        </button>
      }
    </div>
  `,
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

  protected setLang(lang: SupportedLang): void {
    this.transloco.setActiveLang(lang);
  }
}
