import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

/**
 * Generic forbidden state for routes that the ownership guard
 * redirected. Visually identical to ErrorState but kept separate so
 * copy and tests can target it precisely.
 */
@Component({
  selector: 'app-forbidden-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule],
  template: `
    <p class="state state--forbidden" role="alert" [attr.data-testid]="testId()">
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
      .state--forbidden {
        background: rgba(192, 57, 43, 0.1);
        color: #c0392b;
      }
    `,
  ],
})
export class ForbiddenStateComponent {
  readonly labelKey = input.required<string>();
  readonly testId = input<string>('state-forbidden');
}
