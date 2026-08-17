import { Injectable, computed, signal } from '@angular/core';

import type { Comment } from './models/comment.model';

// `setItems` es reference-stable: solo emite nuevo array (y Map)
// cuando el contenido cambia, así el grafo de effects no se
// re-dispara en cada refetch y no entramos en bucle de CD.
@Injectable({ providedIn: 'root' })
export class CommentsStore {
  private readonly _byPost = signal<ReadonlyMap<string, readonly Comment[]>>(new Map());
  private readonly _hasMoreByPost = signal<ReadonlyMap<string, boolean>>(new Map());
  private readonly _loadingMoreByPost = signal<ReadonlyMap<string, boolean>>(new Map());

  readonly byPost = this._byPost.asReadonly();

  forPost(postId: () => string) {
    return computed(() => this._byPost().get(postId()) ?? EMPTY);
  }

  hasMoreFor(postId: () => string) {
    return computed(() => this._hasMoreByPost().get(postId()) ?? false);
  }

  loadingMoreFor(postId: () => string) {
    return computed(() => this._loadingMoreByPost().get(postId()) ?? false);
  }

  // Ingiere la página 1 mezclando con lo que ya había en caché.
  //
  // Los items que están en ambos (cache y comments) se reemplazan
  // por la copia fresca — el caso normal tras una mutación como
  // crear un comentario, donde la entrada recién prependada hay que
  // reconciliarla con el snapshot del servidor.
  //
  // Los items que solo están en la caché (ya no vienen en
  // `comments`) se conservan: vienen de un `loadMore` previo y deben
  // sobrevivir al refetch para no perder la posición de scroll.
  //
  // `hasMore` por defecto a `true` para que los callers que no
  // paginan también funcionen; la integración con httpResource lo
  // sobreescribe desde el wrapper `ServerPage`.
  observe(postId: string, comments: readonly Comment[], hasMore = true): void {
    const existing = this._byPost().get(postId) ?? [];
    const newIds = new Set(comments.map((c) => c.id));
    const rest = existing.filter((c) => !newIds.has(c.id));
    this.setItems(postId, [...comments, ...rest]);
    this.setHasMore(postId, hasMore);
  }

  loadMore(postId: string, comments: readonly Comment[], hasMore: boolean): void {
    if (comments.length === 0) {
      this.setHasMore(postId, false);
      this.setLoadingMore(postId, false);
      return;
    }
    const existing = this._byPost().get(postId) ?? [];
    this.setItems(postId, [...existing, ...comments]);
    this.setHasMore(postId, hasMore);
    this.setLoadingMore(postId, false);
  }

  prepend(postId: string, comment: Comment): void {
    const existing = this._byPost().get(postId) ?? [];
    this.setItems(postId, [comment, ...existing]);
  }

  replace(postId: string, comment: Comment): void {
    const existing = this._byPost().get(postId) ?? [];
    this.setItems(
      postId,
      existing.map((c) => (c.id === comment.id ? comment : c)),
    );
  }

  remove(postId: string, id: string): void {
    const existing = this._byPost().get(postId) ?? [];
    this.setItems(
      postId,
      existing.filter((c) => c.id !== id),
    );
  }

  clear(postId: string): void {
    if (!this._byPost().has(postId)) {
      return;
    }
    const next = new Map(this._byPost());
    next.delete(postId);
    this._byPost.set(next);
    this.setHasMore(postId, false);
    this.setLoadingMore(postId, false);
  }

  /** Cambia el flag `loadingMore` para `postId` al valor dado. */
  setLoadingMore(postId: string, value: boolean): void {
    const map = this._loadingMoreByPost();
    if (map.get(postId) === value) {
      return;
    }
    const next = new Map(map);
    next.set(postId, value);
    this._loadingMoreByPost.set(next);
  }

  private setItems(postId: string, items: readonly Comment[]): void {
    const sorted = sortByCreatedDesc(items);
    const existing = this._byPost().get(postId);
    if (existing && sameComments(existing, sorted)) {
      return;
    }
    const next = new Map(this._byPost());
    next.set(postId, sorted);
    this._byPost.set(next);
  }

  private setHasMore(postId: string, value: boolean): void {
    const map = this._hasMoreByPost();
    if (map.get(postId) === value) {
      return;
    }
    const next = new Map(map);
    next.set(postId, value);
    this._hasMoreByPost.set(next);
  }
}

const EMPTY: readonly Comment[] = Object.freeze([]) as readonly Comment[];

/**
 * Ordena comentarios por `createdAt` descendente.
 *
 * json-server a veces persiste un comentario sin `createdAt` (no lo
 * autogenera en cada POST). La resta con NaN deja el orden de V8
 * indefinido, así que una fila sin timestamp puede caer en
 * cualquier sitio. Para mantenerlo determinista, los items sin
 * timestamp parseable se tratan como "ahora" y suben arriba.
 */
function sortByCreatedDesc(comments: readonly Comment[]): readonly Comment[] {
  const copy = [...comments];
  copy.sort((a, b) => {
    const ta = parseCreatedAt(a.createdAt);
    const tb = parseCreatedAt(b.createdAt);
    // Newer first.
    return tb - ta;
  });
  return copy;
}

/**
 * Parsea `createdAt` a timestamp en ms. Si falta o no es parseable
 * devuelve `Date.now()` para que la fila suba arriba.
 */
function parseCreatedAt(value: string | undefined): number {
  if (!value) {
    return Date.now();
  }
  const t = Date.parse(value);
  return Number.isNaN(t) ? Date.now() : t;
}

/**
 * Igualdad estructural sobre (id, body, userId, postId, createdAt).
 * Decide si una nueva lista entrante cambia algo en la caché.
 * Sensible al orden: el caller debe pre-ordenar.
 */
function sameComments(a: readonly Comment[], b: readonly Comment[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (
      x.id !== y.id ||
      x.body !== y.body ||
      x.userId !== y.userId ||
      x.postId !== y.postId ||
      x.createdAt !== y.createdAt
    ) {
      return false;
    }
  }
  return true;
}
