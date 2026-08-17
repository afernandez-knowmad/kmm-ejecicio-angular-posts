import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// djb2 para pick determinista: el mismo nombre siempre cae en el
// mismo color y la lista queda visualmente estable.
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

function hashName(name: string): number {
  let hash = 5381;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 33) ^ name.charCodeAt(i);
  }
  return hash >>> 0;
}

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

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none"
      [style.width.px]="size()"
      [style.height.px]="size()"
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
  readonly name = input.required<string>();
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
