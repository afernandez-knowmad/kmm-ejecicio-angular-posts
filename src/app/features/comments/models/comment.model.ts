/**
 * Domain model for a comment as stored by the mock backend.
 *
 * A comment belongs to exactly one post (`postId`) and is authored by
 * exactly one user (`userId`). Ownership checks compare
 * `Comment.userId` against the authenticated user's id.
 */
export interface Comment {
  readonly id: string;
  readonly postId: string;
  readonly userId: string;
  readonly body: string;
  /** ISO-8601 string. Parsing to `Date` is deferred to the UI layer. */
  readonly createdAt: string;
}

/**
 * Payload accepted by the api when creating a new comment.
 *
 * `id` and `createdAt` are assigned by the backend, so they are not part
 * of the input contract.
 */
export type NewComment = Omit<Comment, 'id' | 'createdAt'>;

/**
 * Payload accepted by the api when updating a comment.
 *
 * Only `body` is editable, but the type is left open for future fields.
 */
export type CommentPatch = Partial<NewComment>;
