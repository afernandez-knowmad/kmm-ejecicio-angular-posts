import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

/**
 * Generic loading indicator. Renders a transloco-driven label inside
 * a soft container so it can be dropped into any page's @switch
 * branch.
 */
@Component({
  selector: 'app-loading-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule],
  template: `
    <p
      class="state state--loading"
      role="status"
      [attr.aria-live]="'polite'"
      [attr.data-testid]="testId()"
    >
      {{ labelKey() | transloco }}
    </p>
  `,
  styles: [
    `
      .state {
        margin: 0;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        background: rgba(0, 0, 0, 0.04);
        font-size: 0.875rem;
      }
      .state--loading {
        background: rgba(0, 0, 0, 0.04);
      }
    `,
  ],
})
export class LoadingStateComponent {
  readonly labelKey = input.required<string>();
  readonly testId = input<string>('state-loading');
}
