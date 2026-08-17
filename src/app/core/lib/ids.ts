export function toId(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

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

// json-server v1-beta filtra con matching estricto de tipo: `?postId=1`
// no matchea registros con `postId` string `"1"`. El seed guarda ids
// numéricos, pero `POST /posts` genera ids alfanuméricos. Devolvemos
// number cuando es puramente numérico y string en caso contrario.
export function toBackendId(value: string | number | null | undefined): string | number {
  const n = toNumericId(value);
  return Number.isFinite(n) ? n : toId(value);
}

export function isOwner(
  resourceUserId: string | number | undefined,
  currentUserId: string | number | undefined,
): boolean {
  const a = toId(resourceUserId);
  const b = toId(currentUserId);
  return a.length > 0 && a === b;
}
