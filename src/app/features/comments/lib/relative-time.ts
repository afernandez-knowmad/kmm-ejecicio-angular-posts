/**
 * Relative time + absolute time formatter for comments.
 *
 * Builds a two-part string suitable for display in the comment header:
 *
 *   - `label`: a human-readable relative time (e.g. "Hoy" / "Today",
 *     "Ayer" / "Yesterday", or a localised date fallback).
 *   - `time`: a localised absolute time (HH:mm) shown after a comma.
 *
 * The split lets the caller format with the user's locale and decide
 * its own separator (the spec calls for a comma between them).
 */

export interface RelativeTime {
  /** Relative bucket ("Hoy"/"Today", "Ayer"/"Yesterday", or a fallback date). */
  readonly label: string;
  /** Localised absolute time in HH:mm, empty when the date is invalid. */
  readonly time: string;
}

/**
 * Compute the relative+absolute pair for an ISO timestamp.
 *
 * Buckets, evaluated against the calendar day of `now`:
 *   - same calendar day:        "Hoy" / "Today"
 *   - previous calendar day:    "Ayer" / "Yesterday"
 *   - older:                    localised date in d/M/yyyy format
 *
 * `lang` is a BCP-47 tag (`es`, `en`, ...). An invalid date returns
 * an empty pair.
 */
export function formatRelativeTime(
  iso: string | undefined | null,
  now: Date,
  lang: string,
): RelativeTime {
  if (!iso) {
    return { label: '', time: '' };
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return { label: '', time: '' };
  }

  const locale = lang === 'es' ? 'es-ES' : lang;
  const isEs = lang.startsWith('es');

  let label: string;
  if (sameCalendarDay(date, now)) {
    label = isEs ? 'Hoy' : 'Today';
  } else if (isYesterday(date, now)) {
    label = isEs ? 'Ayer' : 'Yesterday';
  } else {
    label = new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  return { label, time };
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isYesterday(date: Date, now: Date): boolean {
  // Build yesterday's calendar day explicitly so the comparison
  // works correctly across month/year boundaries (Date.setDate
  // rolls underflow correctly, but constructing the date from the
  // Y/M/D components keeps the comparison intent obvious).
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return sameCalendarDay(date, yesterday);
}
