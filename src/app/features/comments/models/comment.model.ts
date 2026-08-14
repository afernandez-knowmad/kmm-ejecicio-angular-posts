/**
 * Domain model for a comment as stored by the mock backend.
 *
 * A comment belongs to exactly one post (`postId`) and is authored by
 * exactly one user (`userId`). Ownership checks compare
 * `Comment.userId` against the authenticated user's id.
 *
 * NOTE on types: json-server v1-beta stores ids in whatever type the
 * client sends. The seed in `db.json` keeps `postId`/`userId` as
 * **numbers** (`1`, `2`, ...), while `POST /posts` and `POST /comments`
 * auto-generate **alphanumeric** ids (`"n1I0hof7I3o"`). We therefore
 * model these fields as `string | number` and rely on `toBackendId`
 * in the api layer to send the type the backend expects for each
 * case. Comparisons against ids from other sources should normalise
 * via `toId`/`isOwner` from `core/lib/ids`.
 */
export interface Comment {
  readonly id: string;
  readonly postId: string | number;
  readonly userId: string | number;
  readonly body: string;
  /** ISO-8601 string. Parsing to `Date` is deferred to the UI layer. */
  readonly createdAt: string;
}

/**
 * Payload accepted by the api when creating a new comment.
 *
 * `id` is assigned by the backend. `createdAt` is optional because
 * json-server is unreliable about auto-generating it on POST, so the
 * form sends one explicitly to guarantee the persisted row has a
 * usable timestamp for sorting/display.
 */
export type NewComment = Omit<Comment, 'id' | 'postId' | 'userId'> & {
  readonly postId: string | number;
  readonly userId: string | number;
  readonly createdAt?: string;
};

/**
 * Payload accepted by the api when updating a comment.
 *
 * Only `body` is editable, but the type is left open for future fields.
 */
export type CommentPatch = Partial<NewComment>;
