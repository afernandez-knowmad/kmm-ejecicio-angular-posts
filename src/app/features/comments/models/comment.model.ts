/**
 * Modelo de dominio de un comentario según el backend mock.
 *
 * Un comentario pertenece a un post (`postId`) y lo escribe un
 * usuario (`userId`). El check de ownership compara
 * `Comment.userId` con el id del usuario autenticado.
 *
 * Sobre los tipos: json-server v1-beta guarda los ids en el tipo
 * que mande el cliente. El seed de `db.json` usa ids numéricos
 * (`1`, `2`, ...), pero `POST /posts` y `POST /comments`
 * autogeneran ids alfanuméricos (`"n1I0hof7I3o"`). Por eso
 * modelamos los campos como `string | number` y delegamos en
 * `toBackendId` en la capa de api para enviar el tipo que el
 * backend espera. Las comparaciones con ids de otras fuentes se
 * normalizan con `toId` / `isOwner` de `core/lib/ids`.
 */
export interface Comment {
  readonly id: string;
  readonly postId: string | number;
  readonly userId: string | number;
  readonly body: string;
  /** String ISO-8601. El parseo a `Date` se delega a la capa de UI. */
  readonly createdAt: string;
}

/**
 * Payload del create.
 *
 * `id` lo asigna el backend. `createdAt` es opcional porque
 * json-server no siempre lo autogenera en el POST; el formulario
 * lo manda explícito para garantizar timestamp útil en sort/display.
 */
export type NewComment = Omit<Comment, 'id' | 'postId' | 'userId'> & {
  readonly postId: string | number;
  readonly userId: string | number;
  readonly createdAt?: string;
};

/**
 * Payload del update. Hoy solo `body` es editable, pero el tipo
 * queda abierto por si se añaden campos.
 */
export type CommentPatch = Partial<NewComment>;
