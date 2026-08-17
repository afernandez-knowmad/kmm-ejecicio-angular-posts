import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule],
  host: { class: 'block' },
  template: `
    <p
      class="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-500"
      [attr.data-testid]="testId()"
    >
      {{ labelKey() | transloco }}
    </p>
  `,
})
export class EmptyStateComponent {
  readonly labelKey = input.required<string>();
  readonly testId = input<string>('state-empty');
}
