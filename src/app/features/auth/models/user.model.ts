/**
 * Domain model for a user as stored by the mock backend.
 *
 * The mock backend (`db.json`) returns users with these fields. The
 * `password` field is only present when the api is queried for login
 * validation; it must never reach the UI or be cached in public-facing
 * state.
 */
export interface User {
  /** json-server emits ids as strings even when the seed value is numeric. */
  readonly id: string;
  readonly name: string;
  readonly password: string;
  readonly email: string;
  readonly avatar: string;
}

/**
 * Public projection of `User` that excludes sensitive fields.
 *
 * Use this type anywhere the user is rendered, logged or passed to
 * non-auth code paths.
 */
export type PublicUser = Omit<User, 'password'>;

/**
 * Credentials used by the login form.
 */
export interface LoginCredentials {
  readonly name: string;
  readonly password: string;
}
