import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-loading-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule],
  host: { class: 'block' },
  template: `
    <p
      class="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-500"
      role="status"
      [attr.aria-live]="'polite'"
      [attr.data-testid]="testId()"
    >
      <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-brand-500"></span>
      {{ labelKey() | transloco }}
    </p>
  `,
})
export class LoadingStateComponent {
  readonly labelKey = input.required<string>();
  readonly testId = input<string>('state-loading');
}
