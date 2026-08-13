import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

/**
 * Generic error state. role="alert" makes it announce itself to
 * assistive tech the moment it appears.
 */
@Component({
  selector: 'app-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule],
  template: `
    <p class="state state--error" role="alert" [attr.data-testid]="testId()">
      {{ labelKey() | transloco }}
    </p>
  `,
  styles: [
    `
      .state {
        margin: 0;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.875rem;
      }
      .state--error {
        background: rgba(192, 57, 43, 0.1);
        color: #c0392b;
      }
    `,
  ],
})
export class ErrorStateComponent {
  readonly labelKey = input.required<string>();
  readonly testId = input<string>('state-error');
}
