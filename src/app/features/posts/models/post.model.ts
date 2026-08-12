/**
 * Domain model for a post as stored by the mock backend.
 *
 * The mock backend keeps `userId` and `id` as strings (see `db.json`).
 * Ownership checks compare `Post.userId` against the authenticated
 * user's id (also a string).
 */
export interface Post {
  readonly id: string;
  readonly userId: string;
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
  /** ISO-8601 string. Parsing to `Date` is deferred to the UI layer. */
  readonly createdAt: string;
}

/**
 * Payload accepted by the api when creating a new post.
 *
 * `id` and `createdAt` are assigned by the backend, so they are not part
 * of the input contract.
 */
export type NewPost = Omit<Post, 'id' | 'createdAt'>;

/**
 * Payload accepted by the api when updating a post.
 *
 * All editable fields are optional so partial updates are supported.
 */
export type PostPatch = Partial<NewPost>;
