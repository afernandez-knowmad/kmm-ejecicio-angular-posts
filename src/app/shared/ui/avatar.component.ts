import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Curated palette of muted avatar backgrounds. The pick is
 * deterministic — the same name always renders the same colour —
 * which keeps the rendered list visually stable.
 */
const AVATAR_PALETTE: readonly string[] = [
  '#dbeafe', // blue-100
  '#e0e7ff', // indigo-100
  '#ede9fe', // violet-100
  '#fce7f3', // pink-100
  '#ffe4e6', // rose-100
  '#ffedd5', // orange-100
  '#fef3c7', // amber-100
  '#d1fae5', // emerald-100
  '#ccfbf1', // teal-100
  '#cffafe', // cyan-100
];

const AVATAR_FOREGROUND = '#1e293b'; // slate-800

/**
 * Best-effort djb2 hash. Small and stable, fine for picking a palette
 * slot from a string. We don't need cryptographic strength here.
 */
function hashName(name: string): number {
  let hash = 5381;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 33) ^ name.charCodeAt(i);
  }
  return hash >>> 0;
}

/**
 * Pick the first `count` initials from a name. Splits on whitespace
 * and ignores empty pieces. Falls back to the first character when
 * the name has no whitespace.
 */
function initialsFromName(name: string, count = 2): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);
  if (parts.length === 0) {
    return '?';
  }
  const picked = parts.slice(0, count).map((part) => part.charAt(0).toUpperCase());
  return picked.join('');
}

/**
 * Stand-alone avatar component. Renders colour-tinted initials in a
 * circle, matching the design shown in the screenshots. Sized via
 * Tailwind utility classes on the host (`size-8`, `size-10`, etc.).
 *
 * The seed can be either a display name (default) or a user id — it
 * only affects which colour/pair of initials is shown.
 */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center justify-center rounded-full font-semibold select-none"
      [style.background-color]="bg()"
      [style.color]="fg()"
      [style.font-size]="fontSize()"
      [attr.aria-label]="alt()"
      role="img"
    >
      {{ initials() }}
    </span>
  `,
  host: { class: 'inline-flex' },
  styles: [
    `
      :host {
        display: inline-flex;
      }
    `,
  ],
})
export class AvatarComponent {
  /** Name used to derive initials and a stable palette pick. */
  readonly name = input.required<string>();
  /** Size in pixels. Defaults to 32 (matches `size-8`). */
  readonly size = input<number>(32);

  protected readonly initials = computed(() => initialsFromName(this.name()));
  protected readonly bg = computed(() => {
    const slot = hashName(this.name()) % AVATAR_PALETTE.length;
    return AVATAR_PALETTE[slot];
  });
  protected readonly fg = computed(() => AVATAR_FOREGROUND);
  protected readonly fontSize = computed(() => `${Math.round(this.size() * 0.4)}px`);
  protected readonly alt = computed(() => this.name());
}
