import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule],
  host: { class: 'block' },
  template: `
    <p
      class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
      role="alert"
      [attr.data-testid]="testId()"
    >
      {{ labelKey() | transloco }}
    </p>
  `,
})
export class ErrorStateComponent {
  readonly labelKey = input.required<string>();
  readonly testId = input<string>('state-error');
}
