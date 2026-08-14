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
 * Coerce an id to the shape json-server expects for the seeded data.
 *
 * json-server v1-beta filters with strict type matching: querying
 * `?postId=1` only matches records whose `postId` is the **number**
 * 1, and `?postId="1"` only matches the string `"1"`. The seed in
 * `db.json` keeps resource ids as **numeric** strings (`"1"`,
 * `"2"`, ...), but `POST /posts` auto-generates **alphanumeric**
 * ids (`"n1I0hof7I3o"`). Sending a numeric seed as a string (or
 * vice-versa) silently breaks the create flow: the POST succeeds
 * with 200, but the resulting row never re-appears in the list
 * query — so the UI looks like the comment "didn't take".
 *
 * This helper returns the numeric form when the value is purely
 * numeric (so it matches the seed), and the string form otherwise
 * (so it matches auto-generated ids).
 */
export function toBackendId(value: string | number | null | undefined): string | number {
  const n = toNumericId(value);
  return Number.isFinite(n) ? n : toId(value);
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
