/**
 * Convierte un id entrante a string canónico.
 *
 * `users[].id` llega como string, pero `posts.userId` y
 * `comments.userId` aparentan ser number en `db.json`. json-server
 * lo normaliza todo a string en sus respuestas, así que este helper
 * garantiza comparaciones consistentes en el borde.
 */
export function toId(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

/**
 * Parsea un id a number finito o devuelve NaN. Útil cuando la API
 * espera number (p.ej. query param `_page`) pero los ids se guardan
 * como string.
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
 * Devuelve el id en la forma que espera json-server para los datos
 * del seed.
 *
 * json-server v1-beta filtra con matching estricto de tipo:
 * `?postId=1` solo matchea registros con `postId` **number** 1, y
 * `?postId="1"` solo el string `"1"`. El seed de `db.json` guarda
 * ids numéricos (`"1"`, `"2"`...), pero `POST /posts` genera ids
 * alfanuméricos (`"n1I0hof7I3o"`). Mandar un id del seed como string
 * (o al revés) rompe en silencio el create: el POST devuelve 200
 * pero la fila no aparece en la siguiente consulta.
 *
 * Devuelve number cuando el valor es puramente numérico (match con
 * el seed) y string en caso contrario (match con ids autogenerados).
 */
export function toBackendId(value: string | number | null | undefined): string | number {
  const n = toNumericId(value);
  return Number.isFinite(n) ? n : toId(value);
}

/**
 * Check de ownership estricto. Solo true si ambos ids están definidos
 * y son iguales como string.
 */
export function isOwner(
  resourceUserId: string | number | undefined,
  currentUserId: string | number | undefined,
): boolean {
  const a = toId(resourceUserId);
  const b = toId(currentUserId);
  return a.length > 0 && a === b;
}
