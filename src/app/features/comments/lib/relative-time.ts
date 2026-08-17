export interface RelativeTime {
  readonly label: string;
  readonly time: string;
}

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
  // Construimos "ayer" a mano con Y/M/D para que la comparación
  // funcione bien cruzando límites de mes/año.
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return sameCalendarDay(date, yesterday);
}
