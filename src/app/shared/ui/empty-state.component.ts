import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

/**
 * Generic empty state. Use when an HTTP resource resolves
 * successfully but the data is empty (no posts, no comments, etc.).
 */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule],
  template: `
    <p class="state state--empty" [attr.data-testid]="testId()">
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
      .state--empty {
        background: rgba(0, 0, 0, 0.03);
        color: rgba(0, 0, 0, 0.65);
      }
    `,
  ],
})
export class EmptyStateComponent {
  readonly labelKey = input.required<string>();
  readonly testId = input<string>('state-empty');
}
