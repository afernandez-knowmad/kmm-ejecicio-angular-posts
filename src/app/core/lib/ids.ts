/**
 * Coerce an incoming id (string | number) to its canonical string form.
 *
 * The mock backend emits `users[].id` as a string but `posts.userId` and
 * `comments.userId` look like numbers in `db.json`. json-server
 * normalises everything to strings in responses, so this helper exists
 * to guarantee consistent comparisons at the boundary.
 */
export function toId(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

/**
 * Parse a string id into a finite number, falling back to `NaN`.
 *
 * Useful when the api contract expects a number (e.g. `_page` query
 * params) but we have stored ids as strings.
 */
export function toNumericId(value: string | number | null | undefined): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : Number.NaN;
  }
  if (value === null || value === undefined || value === '') {
    return Number.NaN;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/**
 * Strict ownership check.
 *
 * Returns `true` only when both ids are defined and equal as strings.
 */
export function isOwner(
  resourceUserId: string | number | undefined,
  currentUserId: string | number | undefined,
): boolean {
  const a = toId(resourceUserId);
  const b = toId(currentUserId);
  return a.length > 0 && a === b;
}
